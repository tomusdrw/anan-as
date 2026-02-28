#!/usr/bin/env node
/**
 * Benchmark Comparison Tool
 * 
 * Compares two benchmark result JSON files and reports regressions/improvements.
 * 
 * Usage:
 *   tsx bench/compare.ts <baseline.json> <results.json> [--threshold <percent>]
 * 
 * Options:
 *   --threshold <n>   Regression threshold as percentage (default: 5%)
 *   --verbose         Show detailed per-trace comparison
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  options: {
    threshold: { type: "string", short: "t", default: "5" },
    verbose: { type: "boolean", short: "v", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: true,
});

if (values.help || positionals.length < 2) {
  console.log(`Usage: tsx bench/compare.ts <baseline.json> <results.json> [options]

Options:
  -t, --threshold <n>   Regression threshold as percentage (default: 5%)
  -v, --verbose         Show detailed per-trace comparison
  -h, --help           Show this help`);
  process.exit(0);
}

const [baselinePath, resultsPath] = positionals;
const threshold = parseFloat(values.threshold!);

// Validate threshold
if (!Number.isFinite(threshold) || threshold < 0) {
  console.error(`Error: Invalid threshold value: ${values.threshold}. Must be a non-negative number.`);
  process.exit(1);
}
const baselineFile = resolve(baselinePath);
const resultsFile = resolve(resultsPath);

if (!existsSync(baselineFile)) {
  console.error(`Error: Baseline file not found: ${baselineFile}`);
  process.exit(1);
}

if (!existsSync(resultsFile)) {
  console.error(`Error: Results file not found: ${resultsFile}`);
  process.exit(1);
}

const baseline = JSON.parse(readFileSync(baselineFile, "utf-8"));
const results = JSON.parse(readFileSync(resultsFile, "utf-8"));

type TraceResult = {
  name: string;
  medianMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
};

type SuiteResult = {
  timestamp: string;
  traces: TraceResult[];
  w3f: TraceResult | null;
  summary: {
    totalTraceMedianMs: number;
    w3fMedianMs: number | null;
  };
};

const baselineSuite = baseline as SuiteResult;
const resultsSuite = results as SuiteResult;

// Build maps for easy lookup
const baselineTraces = new Map(
  baselineSuite.traces.map((t) => [t.name, t])
);
const resultsTraces = new Map(
  resultsSuite.traces.map((t) => [t.name, t])
);

interface Comparison {
  name: string;
  baselineMs: number;
  currentMs: number;
  diffMs: number;
  diffPercent: number;
  status: "improvement" | "regression" | "neutral";
}

const comparisons: Comparison[] = [];
let regressions: Comparison[] = [];
let improvements: Comparison[] = [];

// Compare traces
for (const [name, baselineTrace] of baselineTraces) {
  const currentTrace = resultsTraces.get(name);
  if (!currentTrace) {
    console.warn(`Warning: No results for trace ${name}, skipping`);
    continue;
  }

  const diffMs = currentTrace.medianMs - baselineTrace.medianMs;
  
  // Guard against division by zero
  let diffPercent: number;
  if (baselineTrace.medianMs === 0) {
    diffPercent = diffMs === 0 ? 0 : (diffMs > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
  } else {
    diffPercent = (diffMs / baselineTrace.medianMs) * 100;
  }
  let status: "improvement" | "regression" | "neutral" = "neutral";
  if (diffPercent > threshold) {
    status = "regression";
    regressions.push({
      name,
      baselineMs: baselineTrace.medianMs,
      currentMs: currentTrace.medianMs,
      diffMs,
      diffPercent,
      status,
    });
  } else if (diffPercent < -threshold) {
    status = "improvement";
    improvements.push({
      name,
      baselineMs: baselineTrace.medianMs,
      currentMs: currentTrace.medianMs,
      diffMs,
      diffPercent,
      status,
    });
  }

  comparisons.push({
    name,
    baselineMs: baselineTrace.medianMs,
    currentMs: currentTrace.medianMs,
    diffMs,
    diffPercent,
    status,
  });
}

// Sort by absolute diff percentage
regressions.sort((a, b) => b.diffPercent - a.diffPercent);
improvements.sort((a, b) => a.diffPercent - b.diffPercent);

// Print results
console.log("\n=== Benchmark Comparison ===\n");
console.log(`Baseline: ${baselineSuite.timestamp}`);
console.log(`Results:  ${resultsSuite.timestamp}`);
console.log(`Threshold: ${threshold}%\n`);

console.log("--- Summary ---\n");
console.log(
  `Total trace time: ${baselineSuite.summary.totalTraceMedianMs.toFixed(1)}ms -> ${resultsSuite.summary.totalTraceMedianMs.toFixed(1)}ms`
);
const totalDiff =
  resultsSuite.summary.totalTraceMedianMs -
  baselineSuite.summary.totalTraceMedianMs;

// Guard against division by zero
let totalDiffPercent: number;
if (baselineSuite.summary.totalTraceMedianMs === 0) {
  totalDiffPercent = totalDiff === 0 ? 0 : (totalDiff > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
} else {
  totalDiffPercent = (totalDiff / baselineSuite.summary.totalTraceMedianMs) * 100;
}
  `Difference:     ${totalDiff >= 0 ? "+" : ""}${totalDiff.toFixed(1)}ms (${totalDiffPercent.toFixed(2)}%)`
);

if (baselineSuite.w3f && resultsSuite.w3f) {
  const w3fDiff =
    resultsSuite.w3f.medianMs - baselineSuite.w3f.medianMs;
  
  // Guard against division by zero
  let w3fDiffPercent: number;
  if (baselineSuite.w3f.medianMs === 0) {
    w3fDiffPercent = w3fDiff === 0 ? 0 : (w3fDiff > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
  } else {
    w3fDiffPercent = (w3fDiff / baselineSuite.w3f.medianMs) * 100;
  }
    `\nW3F suite:      ${baselineSuite.w3f.medianMs.toFixed(1)}ms -> ${resultsSuite.w3f.medianMs.toFixed(1)}ms`
  );
  console.log(
    `Difference:     ${w3fDiff >= 0 ? "+" : ""}${w3fDiff.toFixed(1)}ms (${w3fDiffPercent.toFixed(2)}%)`
  );
}

console.log(`\nRegressions: ${regressions.length}`);
console.log(`Improvements: ${improvements.length}`);

if (regressions.length > 0) {
  console.log("\n--- Regressions (worst first) ---\n");
  for (const r of regressions) {
    console.log(
      `  ${r.name.padEnd(40)} ${r.currentMs.toFixed(1).padStart(8)}ms  (+${r.diffPercent.toFixed(1)}%)`
    );
  }
}

if (improvements.length > 0) {
  console.log("\n--- Improvements ---\n");
  for (const i of improvements) {
    console.log(
      `  ${i.name.padEnd(40)} ${i.currentMs.toFixed(1).padStart(8)}ms  (${i.diffPercent.toFixed(1)}%)`
    );
  }
}

if (values.verbose && comparisons.length > 0) {
  console.log("\n--- All Traces ---\n");
  comparisons.sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent));
  for (const c of comparisons) {
    const sign = c.diffMs >= 0 ? "+" : "";
    const marker = c.status === "regression" ? "⚠️" : c.status === "improvement" ? "✓" : " ";
    console.log(
      `  ${marker} ${c.name.padEnd(40)} ${c.baselineMs.toFixed(1).padStart(7)}ms -> ${c.currentMs.toFixed(1).padStart(7)}ms  (${sign}${c.diffPercent.toFixed(1)}%)`
    );
  }
}

// Exit code
if (regressions.length > 0) {
  console.log("\n❌ FAILED: Regressions detected above threshold\n");
  process.exit(1);
} else if (improvements.length > 0) {
  console.log("\n✅ PASSED: No regressions (improvements detected)\n");
  process.exit(0);
} else {
  console.log("\n✅ PASSED: No regressions or improvements beyond threshold\n");
  process.exit(0);
}
