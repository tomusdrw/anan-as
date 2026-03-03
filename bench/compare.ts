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

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  options: {
    threshold: { type: "string", short: "t", default: "5" },
    verbose: { type: "boolean", short: "v", default: false },
    markdown: { type: "string", short: "m", default: "" },
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
const threshold = parseFloat(values.threshold ?? "5");

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
  fibonacci?: TraceResult[];
  traces: TraceResult[];
  w3f: TraceResult | null;
  summary: {
    fibonacciMedianMs?: Record<string, number>;
    totalTraceMedianMs: number;
    w3fMedianMs: number | null;
  };
};

const baselineSuite = baseline as SuiteResult;
const resultsSuite = results as SuiteResult;

interface Comparison {
  name: string;
  baselineMs: number;
  currentMs: number;
  diffMs: number;
  diffPercent: number;
  status: "improvement" | "regression" | "neutral";
}

interface ComparisonResult {
  comparisons: Comparison[];
  regressions: Comparison[];
  improvements: Comparison[];
}

function compareBenchmarks(
  baselineItems: TraceResult[],
  currentItems: TraceResult[],
  threshold: number,
  warnOnMissing = false,
): ComparisonResult {
  const baselineMap = new Map(baselineItems.map((t) => [t.name, t]));
  const currentMap = new Map(currentItems.map((t) => [t.name, t]));

  const comparisons: Comparison[] = [];
  const regressions: Comparison[] = [];
  const improvements: Comparison[] = [];

  for (const [name, baseline] of baselineMap) {
    const current = currentMap.get(name);
    if (!current) {
      if (warnOnMissing) {
        console.warn(`Warning: No results for ${name}, skipping`);
      }
      continue;
    }

    const diffMs = current.medianMs - baseline.medianMs;
    let diffPercent: number;
    if (baseline.medianMs === 0) {
      diffPercent = diffMs === 0 ? 0 : diffMs > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
    } else {
      diffPercent = (diffMs / baseline.medianMs) * 100;
    }

    let status: "improvement" | "regression" | "neutral" = "neutral";
    if (diffPercent > threshold) {
      status = "regression";
      regressions.push({
        name,
        baselineMs: baseline.medianMs,
        currentMs: current.medianMs,
        diffMs,
        diffPercent,
        status,
      });
    } else if (diffPercent < -threshold) {
      status = "improvement";
      improvements.push({
        name,
        baselineMs: baseline.medianMs,
        currentMs: current.medianMs,
        diffMs,
        diffPercent,
        status,
      });
    }

    comparisons.push({ name, baselineMs: baseline.medianMs, currentMs: current.medianMs, diffMs, diffPercent, status });
  }

  regressions.sort((a, b) => b.diffPercent - a.diffPercent);
  improvements.sort((a, b) => a.diffPercent - b.diffPercent);

  return { comparisons, regressions, improvements };
}

// Compare fibonacci benchmarks
const fibResult =
  baselineSuite.fibonacci && resultsSuite.fibonacci
    ? compareBenchmarks(baselineSuite.fibonacci, resultsSuite.fibonacci, threshold)
    : { comparisons: [] as Comparison[], regressions: [] as Comparison[], improvements: [] as Comparison[] };
const fibComparisons = fibResult.comparisons;
const fibRegressions = fibResult.regressions;
const fibImprovements = fibResult.improvements;
// Compare traces
const traceResult = compareBenchmarks(baselineSuite.traces, resultsSuite.traces, threshold, true);
const comparisons = traceResult.comparisons;
const regressions = traceResult.regressions;
const improvements = traceResult.improvements;

// Print results
console.log("\n=== Benchmark Comparison ===\n");
console.log(`Baseline: ${baselineSuite.timestamp}`);
console.log(`Results:  ${resultsSuite.timestamp}`);
console.log(`Threshold: ${threshold}%\n`);

console.log("--- Summary ---\n");

// Fibonacci summary
if (fibComparisons.length > 0) {
  console.log("Fibonacci benchmarks:");
  for (const c of fibComparisons) {
    const sign = c.diffMs >= 0 ? "+" : "";
    console.log(
      `  ${c.name.padEnd(20)} ${c.baselineMs.toFixed(1)}ms -> ${c.currentMs.toFixed(1)}ms  (${sign}${c.diffPercent.toFixed(1)}%)`,
    );
  }
  console.log();
}

console.log(
  `Total trace time: ${baselineSuite.summary.totalTraceMedianMs.toFixed(1)}ms -> ${resultsSuite.summary.totalTraceMedianMs.toFixed(1)}ms`,
);
const totalDiff = resultsSuite.summary.totalTraceMedianMs - baselineSuite.summary.totalTraceMedianMs;

// Guard against division by zero
let totalDiffPercent: number;
if (baselineSuite.summary.totalTraceMedianMs === 0) {
  totalDiffPercent = totalDiff === 0 ? 0 : totalDiff > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
} else {
  totalDiffPercent = (totalDiff / baselineSuite.summary.totalTraceMedianMs) * 100;
}
console.log(`Difference:     ${totalDiff >= 0 ? "+" : ""}${totalDiff.toFixed(1)}ms (${totalDiffPercent.toFixed(2)}%)`);

if (baselineSuite.w3f && resultsSuite.w3f) {
  const w3fDiff = resultsSuite.w3f.medianMs - baselineSuite.w3f.medianMs;

  // Guard against division by zero
  let w3fDiffPercent: number;
  if (baselineSuite.w3f.medianMs === 0) {
    w3fDiffPercent = w3fDiff === 0 ? 0 : w3fDiff > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  } else {
    w3fDiffPercent = (w3fDiff / baselineSuite.w3f.medianMs) * 100;
  }
  console.log(
    `\nW3F suite:      ${baselineSuite.w3f.medianMs.toFixed(1)}ms -> ${resultsSuite.w3f.medianMs.toFixed(1)}ms`,
  );
  console.log(`Difference:     ${w3fDiff >= 0 ? "+" : ""}${w3fDiff.toFixed(1)}ms (${w3fDiffPercent.toFixed(2)}%)`);
}

const allRegressions = regressions.length + fibRegressions.length;
const allImprovements = improvements.length + fibImprovements.length;
console.log(`\nRegressions: ${allRegressions}`);
console.log(`Improvements: ${allImprovements}`);

if (regressions.length > 0) {
  console.log("\n--- Regressions (worst first) ---\n");
  for (const r of regressions) {
    console.log(`  ${r.name.padEnd(40)} ${r.currentMs.toFixed(1).padStart(8)}ms  (+${r.diffPercent.toFixed(1)}%)`);
  }
}

if (improvements.length > 0) {
  console.log("\n--- Improvements ---\n");
  for (const i of improvements) {
    console.log(`  ${i.name.padEnd(40)} ${i.currentMs.toFixed(1).padStart(8)}ms  (${i.diffPercent.toFixed(1)}%)`);
  }
}

if (values.verbose && comparisons.length > 0) {
  console.log("\n--- All Traces ---\n");
  comparisons.sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent));
  for (const c of comparisons) {
    const sign = c.diffMs >= 0 ? "+" : "";
    const marker = c.status === "regression" ? "⚠️" : c.status === "improvement" ? "✓" : " ";
    console.log(
      `  ${marker} ${c.name.padEnd(40)} ${c.baselineMs.toFixed(1).padStart(7)}ms -> ${c.currentMs.toFixed(1).padStart(7)}ms  (${sign}${c.diffPercent.toFixed(1)}%)`,
    );
  }
}

// Write markdown report
if (values.markdown) {
  const md = formatMarkdown(
    baselineSuite,
    resultsSuite,
    comparisons,
    regressions,
    improvements,
    fibComparisons,
    fibRegressions,
    fibImprovements,
    totalDiff,
    totalDiffPercent,
    threshold,
  );
  writeFileSync(resolve(values.markdown), md);
  console.log(`\nMarkdown report written to ${values.markdown}`);
}

// Exit code
if (allRegressions > 0) {
  console.log("\n❌ FAILED: Regressions detected above threshold\n");
  process.exit(1);
} else if (allImprovements > 0) {
  console.log("\n✅ PASSED: No regressions (improvements detected)\n");
  process.exit(0);
} else {
  console.log("\n✅ PASSED: No regressions or improvements beyond threshold\n");
  process.exit(0);
}

function formatMarkdown(
  base: SuiteResult,
  current: SuiteResult,
  all: Comparison[],
  regs: Comparison[],
  imps: Comparison[],
  fibAll: Comparison[],
  fibRegs: Comparison[],
  fibImps: Comparison[],
  totalDiffMs: number,
  totalDiffPct: number,
  thresh: number,
): string {
  const sign = (n: number) => (n >= 0 ? "+" : "");
  const totalRegs = regs.length + fibRegs.length;
  const totalImps = imps.length + fibImps.length;
  const status =
    totalRegs > 0
      ? `### :warning: ${totalRegs} regression(s) detected (>${thresh}% threshold)`
      : totalImps > 0
        ? "### :white_check_mark: No regressions (improvements detected)"
        : "### :white_check_mark: No significant changes";

  let md = "## Benchmark Results\n\n";
  md += `${status}\n\n`;

  // Summary table
  md += "| Metric | Baseline | Current | Change |\n";
  md += "|--------|----------|---------|--------|\n";

  // Fibonacci summary rows
  for (const c of fibAll) {
    md += `| **${c.name}** | ${c.baselineMs.toFixed(1)}ms | ${c.currentMs.toFixed(1)}ms | ${sign(c.diffPercent)}${c.diffPercent.toFixed(1)}% |\n`;
  }

  md += `| **Trace total** | ${base.summary.totalTraceMedianMs.toFixed(1)}ms | ${current.summary.totalTraceMedianMs.toFixed(1)}ms | ${sign(totalDiffMs)}${totalDiffMs.toFixed(1)}ms (${sign(totalDiffPct)}${totalDiffPct.toFixed(1)}%) |\n`;

  if (base.w3f && current.w3f) {
    const w3fDiff = current.w3f.medianMs - base.w3f.medianMs;
    const w3fPct = base.w3f.medianMs === 0 ? 0 : (w3fDiff / base.w3f.medianMs) * 100;
    md += `| **W3F suite** | ${base.w3f.medianMs.toFixed(1)}ms | ${current.w3f.medianMs.toFixed(1)}ms | ${sign(w3fDiff)}${w3fDiff.toFixed(1)}ms (${sign(w3fPct)}${w3fPct.toFixed(1)}%) |\n`;
  }

  // Regressions (combined)
  const allRegs = [...fibRegs, ...regs];
  if (allRegs.length > 0) {
    md += "\n<details><summary>Regressions (worst first)</summary>\n\n";
    md += "| Benchmark | Baseline | Current | Change |\n";
    md += "|-----------|----------|---------|--------|\n";
    for (const r of allRegs) {
      md += `| ${r.name} | ${r.baselineMs.toFixed(1)}ms | ${r.currentMs.toFixed(1)}ms | +${r.diffPercent.toFixed(1)}% |\n`;
    }
    md += "\n</details>\n";
  }

  // Improvements (combined)
  const allImps = [...fibImps, ...imps];
  if (allImps.length > 0) {
    md += "\n<details><summary>Improvements</summary>\n\n";
    md += "| Benchmark | Baseline | Current | Change |\n";
    md += "|-----------|----------|---------|--------|\n";
    for (const i of allImps) {
      md += `| ${i.name} | ${i.baselineMs.toFixed(1)}ms | ${i.currentMs.toFixed(1)}ms | ${i.diffPercent.toFixed(1)}% |\n`;
    }
    md += "\n</details>\n";
  }

  // All traces
  if (all.length > 0) {
    const sorted = [...all].sort((a, b) => Math.abs(b.diffPercent) - Math.abs(a.diffPercent));
    md += "\n<details><summary>All traces</summary>\n\n";
    md += "| Trace | Baseline | Current | Change |\n";
    md += "|-------|----------|---------|--------|\n";
    for (const c of sorted) {
      const icon = c.status === "regression" ? ":warning:" : c.status === "improvement" ? ":white_check_mark:" : "";
      md += `| ${icon} ${c.name} | ${c.baselineMs.toFixed(1)}ms | ${c.currentMs.toFixed(1)}ms | ${sign(c.diffPercent)}${c.diffPercent.toFixed(1)}% |\n`;
    }
    md += "\n</details>\n";
  }

  return md;
}
