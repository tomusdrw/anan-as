#!/usr/bin/env node

/**
 * PVM Interpreter Benchmark Suite
 *
 * Runs ecalli trace replays and W3F test vectors, measuring execution time.
 *
 * Usage:
 *   tsx bench/run.ts [--traces <dir>] [--w3f <dir>] [--iterations <n>] [--warmup <n>]
 */

import { readdirSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { parseArgs } from "node:util";
import { performance } from "node:perf_hooks";
import "json-bigint-patch";

import { replayTraceFile } from "../bin/src/trace-replay.js";
import { HasMetadata, InputKind, prepareProgram, runProgram } from "../build/release.js";
import { NoOpTracer } from "../bin/src/tracer.js";

// ---- CLI ----

const { values } = parseArgs({
  options: {
    traces: { type: "string", default: "" },
    w3f: { type: "string", default: "" },
    iterations: { type: "string", default: "5" },
    warmup: { type: "string", default: "1" },
    output: { type: "string", default: "" },
    "block-gas": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (values.help) {
  console.log(`Usage: tsx bench/run.ts [options]

Options:
  --traces <dir>      Directory with ecalli trace .log files
  --w3f <dir>         Directory with W3F test vector .json files
  --iterations <n>    Number of timed iterations (default: 5)
  --warmup <n>        Number of warmup iterations (default: 1)
  --output <file>     Write JSON results to file
  -h, --help          Show this help`);
  process.exit(0);
}

const ITERATIONS = parseInt(values.iterations!, 10);
const WARMUP = parseInt(values.warmup!, 10);

// Validate iterations and warmup
if (!Number.isInteger(ITERATIONS) || ITERATIONS < 1) {
  console.error(`Error: Invalid iterations value: ${values.iterations}. Must be an integer >= 1.`);
  process.exit(1);
}
if (!Number.isInteger(WARMUP) || WARMUP < 0 || WARMUP >= ITERATIONS) {
  console.error(`Error: Invalid warmup value: ${values.warmup}. Must be an integer >= 0 and < iterations (${ITERATIONS}).`);
  process.exit(1);
}
// ---- Types ----

type BenchResult = {
  name: string;
  medianMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  samples: number[];
};

type SuiteResult = {
  timestamp: string;
  traces: BenchResult[];
  w3f: BenchResult | null;
  summary: {
    totalTraceMedianMs: number;
    w3fMedianMs: number | null;
  };
};

// ---- Helpers ----

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function benchRun(name: string, fn: () => void): BenchResult {
  // warmup
  for (let i = 0; i < WARMUP; i++) {
    fn();
  }

  const samples: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const start = performance.now();
    fn();
    const elapsed = performance.now() - start;
    samples.push(elapsed);
  }

  // Guard against empty samples
  if (samples.length === 0) {
    throw new Error(`No samples collected for benchmark: ${name}`);
  }

  const med = median(samples);
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const p95 = percentile(samples, 95);

  return { name, medianMs: med, minMs: min, maxMs: max, p95Ms: p95, samples };
}

function formatResult(r: BenchResult): string {
  return `  ${r.name.padEnd(40)} median=${r.medianMs.toFixed(1)}ms  min=${r.minMs.toFixed(1)}ms  max=${r.maxMs.toFixed(1)}ms  p95=${r.p95Ms.toFixed(1)}ms`;
}

// ---- Trace benchmarks ----

function benchTraces(dir: string): BenchResult[] {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".log"))
    .sort();

  if (files.length === 0) {
    console.log("  No trace files found.");
    return [];
  }

  console.log(`  Found ${files.length} trace files.`);
  const results: BenchResult[] = [];

  for (const file of files) {
    const filePath = join(dir, file);
    const name = basename(file, ".log");

    const result = benchRun(name, () => {
      replayTraceFile(filePath, {
        logs: false,
        hasMetadata: HasMetadata.Yes,
        verify: false,
        tracer: new NoOpTracer(),
        useBlockGas: values["block-gas"],
      });
    });

    console.log(formatResult(result));
    results.push(result);
  }

  return results;
}

// ---- W3F benchmarks ----

type W3fTest = {
  name: string;
  "initial-regs": (bigint | number)[];
  "initial-pc": number;
  "initial-page-map": Array<{ address: number; length: number; "is-writable": boolean }>;
  "initial-memory": Array<{ address: number; contents: number[] }>;
  "initial-gas": bigint | number;
  program: number[];
};

function benchW3f(dir: string): BenchResult | null {
  let files: string[];
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort();
  } catch {
    console.log("  W3F directory not accessible.");
    return null;
  }

  if (files.length === 0) {
    console.log("  No W3F test files found.");
    return null;
  }

  console.log(`  Found ${files.length} W3F test files.`);

  // Pre-parse all test data
  const tests: W3fTest[] = [];
  for (const file of files) {
    const content = readFileSync(join(dir, file), "utf-8");
    tests.push(JSON.parse(content));
  }

  const result = benchRun("w3f-all", () => {
    for (const data of tests) {
      const pageMap = (data["initial-page-map"] || []).map((p) => ({
        ...p,
        access: p["is-writable"] ? 2 : 1,
      }));
      const memory = (data["initial-memory"] || []).map((c) => ({
        address: c.address,
        data: c.contents || [],
      }));
      const registers = (data["initial-regs"] || []).map((x) => BigInt(x));
      const gas = BigInt(data["initial-gas"] || 10000);
      const pc = data["initial-pc"] || 0;

      const exe = prepareProgram(
        InputKind.Generic,
        HasMetadata.No,
        data.program,
        registers,
        pageMap,
        memory,
        [],
        16,
      );
      runProgram(exe, gas, pc, false, false, false, values["block-gas"]);
    }
  });

  console.log(formatResult(result));
  return result;
}

// ---- Main ----

function main() {
  console.log(`\nPVM Benchmark (${ITERATIONS} iterations, ${WARMUP} warmup)\n`);

  const suiteResult: SuiteResult = {
    timestamp: new Date().toISOString(),
    traces: [],
    w3f: null,
    summary: {
      totalTraceMedianMs: 0,
      w3fMedianMs: null,
    },
  };

  // Trace benchmarks
  const traceDirs = [
    values.traces,
    "../anan-as2/bench/traces",
    "./bench/traces",
  ].filter(Boolean);

  let traceDir: string | null = null;
  for (const d of traceDirs) {
    const resolved = resolve(d!);
    if (existsSync(resolved)) {
      traceDir = resolved;
      break;
    }
  }

  if (traceDir) {
    console.log(`Trace replays (${traceDir}):`);
    suiteResult.traces = benchTraces(traceDir);
    suiteResult.summary.totalTraceMedianMs = suiteResult.traces.reduce(
      (sum, r) => sum + r.medianMs,
      0,
    );
    console.log(
      `\n  TOTAL trace median: ${suiteResult.summary.totalTraceMedianMs.toFixed(1)}ms\n`,
    );
  } else {
    console.log("No trace directory found. Skipping trace benchmarks.");
  }

  // W3F benchmarks
  const w3fDirs = [
    values.w3f,
    "./test/gas-cost-tests",
  ].filter(Boolean);

  let w3fDir: string | null = null;
  for (const d of w3fDirs) {
    const resolved = resolve(d!);
    if (existsSync(resolved)) {
      w3fDir = resolved;
      break;
    }
  }

  if (w3fDir) {
    console.log(`W3F test vectors (${w3fDir}):`);
    suiteResult.w3f = benchW3f(w3fDir);
    suiteResult.summary.w3fMedianMs = suiteResult.w3f?.medianMs ?? null;
    console.log();
  } else {
    console.log("No W3F directory found. Skipping W3F benchmarks.");
  }

  // Summary
  console.log("=== Summary ===");
  console.log(`  Trace total median:  ${suiteResult.summary.totalTraceMedianMs.toFixed(1)}ms`);
  if (suiteResult.summary.w3fMedianMs !== null) {
    console.log(`  W3F suite median:    ${suiteResult.summary.w3fMedianMs.toFixed(1)}ms`);
  }

  // Output JSON
  if (values.output) {
    const outputPath = resolve(values.output);
    writeFileSync(outputPath, JSON.stringify(suiteResult, null, 2));
    console.log(`\nResults written to ${outputPath}`);
  }
}

main();
