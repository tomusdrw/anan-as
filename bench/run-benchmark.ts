#!/usr/bin/env tsx
/**
 * Ecalli Trace Replay Benchmark
 *
 * Compares PVM interpreter performance across three versions:
 *   1. current-wasm  — Current branch WASM build (td-js2, portable calls)
 *   2. main-wasm     — Main branch WASM build (previous version)
 *   3. js            — Pure JavaScript portable build
 *
 * Usage:
 *   tsx bench/run-benchmark.ts [options]
 *
 * Options:
 *   --build          Build both branches and save artifacts before benchmarking
 *   --iterations N   Number of replay iterations per trace (default: 5)
 *   --traces-dir D   Directory containing .log trace files (default: bench/traces)
 *   --verify         Run one verification pass before timing (default: false)
 *   --warmup N       Number of warmup iterations (default: 1)
 *   --versions V     Comma-separated list of versions to test (default: current-wasm,main-wasm,js)
 */

import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import minimist from "minimist";
import {
  buildInitialChunks,
  buildInitialPages,
  encodeRegistersFromDump,
  extractSpiArgs,
  isSpiTrace,
  parseTrace,
  STATUS,
  statusToTermination,
  type TraceData,
} from "../bin/src/trace-parse.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal PVM module interface (shared by WASM and JS builds). */
interface PvmModule {
  InputKind: { SPI: number; Generic: number };
  HasMetadata: { Yes: number; No: number };
  prepareProgram(
    kind: number,
    hasMetadata: number,
    program: number[],
    initialRegs: bigint[],
    pages: Array<{ address: number; length: number; access: number }>,
    chunks: Array<{ address: number; data: number[] }>,
    spiArgs: number[],
    preallocatePages: number,
  ): unknown;
  pvmStart(program: unknown, useSbrkGas: boolean): number;
  pvmResume(
    pvmId: number,
    gas: bigint,
    pc: number,
    logs: boolean,
  ): {
    status: number;
    exitCode: number;
    pc: number;
    gas: bigint;
    nextPc: number;
    registers: bigint[];
  } | null;
  pvmSetRegisters(pvmId: number, registers: bigint[]): void;
  pvmReadMemory(pvmId: number, address: number, length: number): Uint8Array | null;
  pvmWriteMemory(pvmId: number, address: number, data: Uint8Array): boolean;
  pvmDestroy(pvmId: number): unknown;
}

type VersionName = "current-wasm" | "main-wasm" | "js" | "typeberry";

type BenchResult = {
  version: VersionName;
  traceFile: string;
  ecalliCount: number;
  /** Execution-only times (excludes program parsing/setup). */
  execTimesMs: number[];
  execMedianMs: number;
  /** Total times (setup + execution). */
  totalTimesMs: number[];
  totalMedianMs: number;
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = minimist(process.argv.slice(2), {
  boolean: ["build", "verify", "help"],
  string: ["iterations", "traces-dir", "warmup", "versions", "preallocate"],
  alias: { h: "help", n: "iterations", d: "traces-dir" },
  default: {
    iterations: "5",
    "traces-dir": "bench/traces",
    warmup: "1",
    versions: "current-wasm,main-wasm,js,typeberry",
    preallocate: "128",
  },
});

if (args.help) {
  console.log(`Usage: tsx bench/run-benchmark.ts [options]

Options:
  --build          Build both branches and save artifacts
  --iterations N   Iterations per trace (default: 5)
  --traces-dir D   Trace files directory (default: bench/traces)
  --verify         Verify correctness before timing
  --warmup N       Warmup iterations (default: 1)
  --versions V     Comma-separated versions (default: current-wasm,main-wasm,js)
  --help, -h       Show this help`);
  process.exit(0);
}

const ITERATIONS = parseInt(args.iterations, 10);
const WARMUP = parseInt(args.warmup, 10);
const PREALLOCATE = parseInt(args.preallocate, 10);
const TRACES_DIR = resolve(args["traces-dir"]);
const VERIFY = args.verify;
const VERSIONS = args.versions.split(",").map((v: string) => v.trim()) as VersionName[];
const DO_BUILD = args.build;

const ROOT = resolve(import.meta.dirname, "..");
const BUILDS_DIR = resolve(ROOT, "bench/builds");

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

function runCmd(cmd: string, cwd: string = ROOT) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: "inherit" });
}

function copyBuildArtifacts(destDir: string) {
  mkdirSync(destDir, { recursive: true });
  const distBuild = join(ROOT, "dist/build");
  // Copy both the release and release-stub WASM + JS bindings
  for (const f of [
    "release.wasm", "release.js", "release.d.ts",
    "release-stub.wasm", "release-stub.js", "release-stub.d.ts",
  ]) {
    const src = join(distBuild, f);
    if (existsSync(src)) {
      copyFileSync(src, join(destDir, f));
    }
  }
}

function buildBothBranches() {
  console.log("\n=== Building current branch ===");
  runCmd("npm run build");
  copyBuildArtifacts(join(BUILDS_DIR, "current"));

  // Also copy the portable JS bundle
  const jsBundleSrc = join(ROOT, "dist/build/js/portable-bundle.js");
  if (existsSync(jsBundleSrc)) {
    mkdirSync(join(BUILDS_DIR, "js"), { recursive: true });
    copyFileSync(jsBundleSrc, join(BUILDS_DIR, "js/portable-bundle.js"));
  }

  console.log("\n=== Building main branch ===");
  // Check for clean working tree
  try {
    execSync("git diff --quiet && git diff --cached --quiet", { cwd: ROOT });
  } catch {
    console.error("Error: Working tree is dirty. Commit or stash changes before --build.");
    process.exit(1);
  }

  const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", { cwd: ROOT }).toString().trim();

  try {
    runCmd("git checkout main");
    runCmd("npm run build");
    copyBuildArtifacts(join(BUILDS_DIR, "main"));
  } finally {
    runCmd(`git checkout ${currentBranch}`);
  }

  console.log("\n=== Build complete ===\n");
}

// ---------------------------------------------------------------------------
// PVM module loading
// ---------------------------------------------------------------------------

async function loadPvmModule(version: VersionName): Promise<PvmModule> {
  // Use release-stub builds to match typeberry's runtime (which generates the traces)
  switch (version) {
    case "current-wasm": {
      const modPath = join(BUILDS_DIR, "current/release-stub.js");
      if (!existsSync(modPath)) {
        throw new Error(`Current WASM build not found at ${modPath}. Run with --build first.`);
      }
      return (await import(modPath)) as PvmModule;
    }
    case "main-wasm": {
      const modPath = join(BUILDS_DIR, "main/release-stub.js");
      if (!existsSync(modPath)) {
        throw new Error(`Main WASM build not found at ${modPath}. Run with --build first.`);
      }
      return (await import(modPath)) as PvmModule;
    }
    case "js": {
      const modPath = join(BUILDS_DIR, "js/portable-bundle.js");
      if (!existsSync(modPath)) {
        throw new Error(`JS portable build not found at ${modPath}. Run with --build first.`);
      }
      return (await import(modPath)) as PvmModule;
    }
    default:
      throw new Error(`Unknown version: ${version}`);
  }
}

// ---------------------------------------------------------------------------
// Typeberry PVM replay
// ---------------------------------------------------------------------------

let tbInterpreter: any = null;
let tbStatus: any = null;

const TYPEBERRY_ROOT = resolve(ROOT, "../typeberry");

async function loadTypeberry(): Promise<void> {
  if (tbInterpreter) return;
  const { Interpreter } = await import(join(TYPEBERRY_ROOT, "packages/core/pvm-interpreter/interpreter.ts"));
  const { Status } = await import(join(TYPEBERRY_ROOT, "packages/core/pvm-interface/status.ts"));
  tbInterpreter = Interpreter;
  tbStatus = Status;
}

function replayTraceTypeberry(trace: TraceData, verify: boolean): ReplayResult {
  const { program, initialMemWrites, start, ecalliEntries, termination } = trace;

  // --- Setup phase ---
  const setupStart = performance.now();

  const useSpi = isSpiTrace(start, initialMemWrites);
  const spiArgs = extractSpiArgs(start, initialMemWrites);
  const int = new tbInterpreter({ useSbrkGas: false });

  if (useSpi) {
    int.resetJam(program, spiArgs, start.pc, start.gas, true);
  } else {
    // For generic traces, use resetGeneric
    int.resetGeneric(program, start.pc, start.gas);
    // Set registers
    for (const [idx, val] of start.registers) {
      int.registers.setU64(idx, val);
    }
  }

  const setupMs = performance.now() - setupStart;

  // --- Execution phase ---
  const execStart = performance.now();
  const entries = [...ecalliEntries];
  const ecalliCount = entries.length;

  let status = int.nextStep();
  while (status === tbStatus.OK) {
    status = int.nextStep();
  }

  while (status === tbStatus.HOST) {
    const expected = entries.shift();
    if (!expected) throw new Error("Unexpected host call");

    if (verify) {
      const exitParam = int.getExitParam();
      const pc = int.getPC();
      const gas = int.gas.get();
      if (exitParam !== expected.index) throw new Error(`ecalli index mismatch: got ${exitParam}, expected ${expected.index}`);
      if (pc !== expected.pc) throw new Error(`ecalli pc mismatch: got ${pc}, expected ${expected.pc}`);
      if (gas !== expected.gas) throw new Error(`ecalli gas mismatch: got ${gas}, expected ${expected.gas} (diff: ${gas - expected.gas})`);
    }

    // Apply memory writes
    for (const write of expected.memWrites) {
      int.memory.store(write.address, write.data);
    }

    // Apply register writes
    for (const setReg of expected.setRegs) {
      int.registers.setU64(setReg.index, setReg.value);
    }

    // Update gas
    if (expected.setGas !== undefined) {
      int.gas.set(expected.setGas);
    }

    // Advance PC
    int.setNextPC(int.getPC() + 1);

    // Continue execution
    status = int.nextStep();
    while (status === tbStatus.OK) {
      status = int.nextStep();
    }
  }

  // Termination
  if (verify) {
    const type = status === tbStatus.HALT ? "HALT" : status === tbStatus.OOG ? "OOG" : status === tbStatus.PANIC ? "PANIC" : `UNKNOWN(${status})`;
    const pc = int.getPC();
    const gas = int.gas.get();
    if (type !== termination.type) throw new Error(`termination type mismatch: ${type} vs ${termination.type}`);
    if (pc !== termination.pc) throw new Error(`termination pc mismatch: got ${pc}, expected ${termination.pc}`);
    if (gas !== termination.gas) throw new Error(`termination gas mismatch: got ${gas}, expected ${termination.gas}`);
  }

  const execMs = performance.now() - execStart;
  return { ecalliCount, setupMs, execMs };
}

// ---------------------------------------------------------------------------
// Replay logic (parameterized by PVM module)
// ---------------------------------------------------------------------------

type ReplayResult = {
  ecalliCount: number;
  setupMs: number;
  execMs: number;
};

function replayTrace(pvm: PvmModule, trace: TraceData, verify: boolean): ReplayResult {
  const { program, initialMemWrites, start, ecalliEntries, termination } = trace;

  // --- Setup phase (program parsing, memory init) ---
  const setupStart = performance.now();

  const useSpi = isSpiTrace(start, initialMemWrites);
  const programInput = Array.from(program);
  const spiArgs = Array.from(extractSpiArgs(start, initialMemWrites));

  const preparedProgram = useSpi
    ? pvm.prepareProgram(pvm.InputKind.SPI, pvm.HasMetadata.Yes, programInput, [], [], [], spiArgs, PREALLOCATE)
    : pvm.prepareProgram(
        pvm.InputKind.Generic,
        pvm.HasMetadata.Yes,
        programInput,
        encodeRegistersFromDump(start.registers),
        buildInitialPages(initialMemWrites),
        buildInitialChunks(initialMemWrites),
        [],
        PREALLOCATE,
      );

  // useSbrkGas=false to match typeberry's pvm-instance-manager configuration
  const id = pvm.pvmStart(preparedProgram, false);
  const setupMs = performance.now() - setupStart;

  // --- Execution phase (actual PVM interpretation) ---
  const execStart = performance.now();
  const entries = [...ecalliEntries]; // shallow copy so we can shift
  const ecalliCount = entries.length;

  try {
    let gas = start.gas;
    let pc = start.pc;

    for (;;) {
      const pause = pvm.pvmResume(id, gas, pc, false);
      if (!pause) {
        throw new Error("pvmResume returned null");
      }

      if (pause.status === STATUS.HOST) {
        const expected = entries.shift();
        if (!expected) {
          throw new Error("Unexpected host call");
        }

        if (verify) {
          if (pause.exitCode !== expected.index) throw new Error(`ecalli index mismatch: got ${pause.exitCode}, expected ${expected.index}`);
          if (pause.pc !== expected.pc) throw new Error(`ecalli pc mismatch: got ${pause.pc}, expected ${expected.pc}`);
          if (pause.gas !== expected.gas) throw new Error(`ecalli gas mismatch: got ${pause.gas}, expected ${expected.gas} (diff: ${pause.gas - expected.gas})`);
        }

        // Verify memreads
        if (verify) {
          for (const read of expected.memReads) {
            const actual = pvm.pvmReadMemory(id, read.address, read.data.length);
            if (!actual) throw new Error(`Failed to read memory`);
          }
        }

        // Apply memory writes
        for (const write of expected.memWrites) {
          pvm.pvmWriteMemory(id, write.address, write.data);
        }

        // Apply register writes
        const regs = pause.registers;
        for (const setReg of expected.setRegs) {
          regs[setReg.index] = setReg.value;
        }
        pvm.pvmSetRegisters(id, regs);

        // Update gas
        gas = expected.setGas !== undefined ? expected.setGas : pause.gas;
        pc = pause.nextPc;
      } else {
        // Termination
        if (verify) {
          const type = statusToTermination(pause.status);
          if (type !== termination.type) throw new Error(`termination type mismatch: ${type} vs ${termination.type}`);
          if (pause.pc !== termination.pc) throw new Error(`termination pc mismatch`);
          if (pause.gas !== termination.gas) throw new Error(`termination gas mismatch`);
        }
        break;
      }
    }
  } finally {
    pvm.pvmDestroy(id);
  }

  const execMs = performance.now() - execStart;
  return { ecalliCount, setupMs, execMs };
}

// ---------------------------------------------------------------------------
// Timing utilities
// ---------------------------------------------------------------------------

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}us`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (DO_BUILD) {
    buildBothBranches();
  }

  // Discover trace files
  if (!existsSync(TRACES_DIR)) {
    console.error(`Traces directory not found: ${TRACES_DIR}`);
    console.error("Run extract-traces.sh first to generate trace files.");
    process.exit(1);
  }

  const traceFiles = readdirSync(TRACES_DIR)
    .filter((f) => f.endsWith(".log"))
    .sort()
    .map((f) => join(TRACES_DIR, f));

  if (traceFiles.length === 0) {
    console.error(`No .log trace files found in ${TRACES_DIR}`);
    process.exit(1);
  }

  console.log(`Found ${traceFiles.length} trace file(s)`);
  console.log(`Versions: ${VERSIONS.join(", ")}`);
  console.log(`Iterations: ${ITERATIONS}, Warmup: ${WARMUP}`);
  if (VERIFY) console.log("Verification: enabled");
  console.log("");

  // Parse all traces upfront (parsing cost is shared)
  const traces = new Map<string, TraceData>();
  for (const file of traceFiles) {
    const name = basename(file);
    try {
      const input = readFileSync(file, "utf8");
      traces.set(name, parseTrace(input));
      const size = statSync(file).size;
      console.log(`  Parsed ${name} (${(size / 1024).toFixed(1)} KB)`);
    } catch (e) {
      console.error(`  Failed to parse ${name}: ${e}`);
    }
  }
  console.log("");

  if (traces.size === 0) {
    console.error("No valid traces to benchmark.");
    process.exit(1);
  }

  // Run benchmarks
  const results: BenchResult[] = [];

  for (const version of VERSIONS) {
    console.log(`\n--- ${version} ---`);

    const isTypeberry = version === "typeberry";

    if (isTypeberry) {
      try {
        await loadTypeberry();
      } catch (e) {
        console.error(`  Skipping ${version}: ${e}`);
        continue;
      }
    }

    let pvm: PvmModule | null = null;
    if (!isTypeberry) {
      try {
        pvm = await loadPvmModule(version);
      } catch (e) {
        console.error(`  Skipping ${version}: ${e}`);
        continue;
      }
    }

    const replay = (trace: TraceData, verify: boolean) =>
      isTypeberry ? replayTraceTypeberry(trace, verify) : replayTrace(pvm!, trace, verify);

    for (const [name, trace] of traces) {
      // Verification pass
      if (VERIFY) {
        try {
          replay(trace, true);
          console.log(`  [${name}] verification OK`);
        } catch (e) {
          console.error(`  [${name}] verification FAILED: ${e}`);
          continue;
        }
      }

      // Warmup
      for (let w = 0; w < WARMUP; w++) {
        replay(trace, false);
      }

      // Timed iterations
      const execTimes: number[] = [];
      const totalTimes: number[] = [];
      let ecalliCount = 0;
      for (let i = 0; i < ITERATIONS; i++) {
        const result = replay(trace, false);
        ecalliCount = result.ecalliCount;
        execTimes.push(result.execMs);
        totalTimes.push(result.setupMs + result.execMs);
      }

      const execMed = median(execTimes);
      const totalMed = median(totalTimes);
      results.push({
        version,
        traceFile: name,
        ecalliCount,
        execTimesMs: execTimes,
        execMedianMs: execMed,
        totalTimesMs: totalTimes,
        totalMedianMs: totalMed,
      });
      console.log(`  [${name}] ${ecalliCount} ecallis, exec: ${formatMs(execMed)}, total: ${formatMs(totalMed)}`);
    }
  }

  // Print summary table
  printSummary(results, traces);
}

function printSummary(results: BenchResult[], traces: Map<string, TraceData>) {
  const traceNames = [...traces.keys()];

  // Print exec-only results (excludes WASM module parsing/program setup)
  console.log("\n\n========== EXECUTION-ONLY RESULTS (excludes setup) ==========\n");
  printTable(results, traceNames, (r) => r.execMedianMs);

  // Print total results (includes setup)
  console.log("\n========== TOTAL RESULTS (setup + execution) ==========\n");
  printTable(results, traceNames, (r) => r.totalMedianMs);
}

function printTable(results: BenchResult[], traceNames: string[], getMs: (r: BenchResult) => number) {
  // Per-trace comparison
  for (const traceName of traceNames) {
    const traceResults = results.filter((r) => r.traceFile === traceName);
    if (traceResults.length === 0) continue;

    const ecallis = traceResults[0].ecalliCount;
    console.log(`${traceName} (${ecallis} ecallis):`);

    const fastest = Math.min(...traceResults.map((r) => getMs(r)));

    for (const r of traceResults) {
      const ms = getMs(r);
      const ratio = ms / fastest;
      const bar = "█".repeat(Math.min(40, Math.round(ratio * 10)));
      const ratioStr = ratio === 1 ? "(fastest)" : `(${ratio.toFixed(2)}x)`;
      console.log(`  ${r.version.padEnd(15)} ${formatMs(ms).padStart(10)}  ${ratioStr.padStart(12)}  ${bar}`);
    }
    console.log("");
  }

  // Aggregate comparison
  if (traceNames.length > 1) {
    console.log("AGGREGATE (sum of medians across all traces):");

    const versionTotals = new Map<string, number>();
    for (const r of results) {
      versionTotals.set(r.version, (versionTotals.get(r.version) ?? 0) + getMs(r));
    }

    const fastestTotal = Math.min(...versionTotals.values());
    for (const [version, total] of versionTotals) {
      const ratio = total / fastestTotal;
      const ratioStr = ratio === 1 ? "(fastest)" : `(${ratio.toFixed(2)}x)`;
      console.log(`  ${version.padEnd(15)} ${formatMs(total).padStart(10)}  ${ratioStr.padStart(12)}`);
    }
    console.log("");
  }
}

main().catch((e) => {
  console.error("Benchmark failed:", e);
  process.exit(1);
});
