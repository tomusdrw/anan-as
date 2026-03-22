#!/usr/bin/env node

import * as assert from "node:assert";
import { parseTrace } from "../bin/src/trace-parse.js";

// Test: round-trip parse of a spec-compliant trace
{
  const input = [
    "program 0x0102aabbccddeeff",
    "memwrite 0x00001000 len=8 <- 0x0000000000000001",
    "start pc=0 gas=10000 r07=0x10 r09=0x10000",
    "",
    "ecalli=10 pc=42 gas=9980 r01=0x1 r03=0x1000",
    "memread 0x00001000 len=4 -> 0x01020304",
    "memread 0x00001020 len=8 -> 0x0000000000000040",
    "memwrite 0x00002000 len=2 <- 0xffee",
    "setreg r00 <- 0x100",
    "setreg r02 <- 0x4",
    "setgas <- 9950",
    "",
    "HALT pc=42 gas=9920 r00=0x100 r02=0x4",
  ].join("\n");

  const trace = parseTrace(input);

  // Program
  assert.deepStrictEqual(Array.from(trace.program), [0x01, 0x02, 0xaa, 0xbb, 0xcc, 0xdd, 0xee, 0xff], "program bytes");

  // Initial memwrite
  assert.strictEqual(trace.initialMemWrites.length, 1, "one initial memwrite");
  assert.strictEqual(trace.initialMemWrites[0].address, 0x00001000, "memwrite address");
  assert.strictEqual(trace.initialMemWrites[0].data.length, 8, "memwrite data length");

  // Start
  assert.strictEqual(trace.start.pc, 0, "start pc");
  assert.strictEqual(trace.start.gas, 10000n, "start gas");
  assert.strictEqual(trace.start.registers.get(7), 0x10n, "start r07");
  assert.strictEqual(trace.start.registers.get(9), 0x10000n, "start r09");
  assert.strictEqual(trace.start.registers.has(0), false, "start r00 omitted (zero)");

  // Ecalli
  assert.strictEqual(trace.ecalliEntries.length, 1, "one ecalli");
  const ecalli = trace.ecalliEntries[0];
  assert.strictEqual(ecalli.index, 10, "ecalli index");
  assert.strictEqual(ecalli.pc, 42, "ecalli pc");
  assert.strictEqual(ecalli.gas, 9980n, "ecalli gas");
  assert.strictEqual(ecalli.registers.get(1), 0x1n, "ecalli r01");
  assert.strictEqual(ecalli.registers.get(3), 0x1000n, "ecalli r03");

  // Memreads
  assert.strictEqual(ecalli.memReads.length, 2, "two memreads");
  assert.strictEqual(ecalli.memReads[0].address, 0x00001000, "memread 0 address");
  assert.strictEqual(ecalli.memReads[0].data.length, 4, "memread 0 length");
  assert.strictEqual(ecalli.memReads[1].address, 0x00001020, "memread 1 address");

  // Memwrites
  assert.strictEqual(ecalli.memWrites.length, 1, "one ecalli memwrite");
  assert.strictEqual(ecalli.memWrites[0].address, 0x00002000, "ecalli memwrite address");

  // Setregs
  assert.strictEqual(ecalli.setRegs.length, 2, "two setregs");
  assert.strictEqual(ecalli.setRegs[0].index, 0, "setreg 0 index");
  assert.strictEqual(ecalli.setRegs[0].value, 0x100n, "setreg 0 value");
  assert.strictEqual(ecalli.setRegs[1].index, 2, "setreg 1 index");
  assert.strictEqual(ecalli.setRegs[1].value, 0x4n, "setreg 1 value");

  // Setgas
  assert.strictEqual(ecalli.setGas, 9950n, "setgas");

  // Termination
  assert.strictEqual(trace.termination.type, "HALT", "termination type");
  assert.strictEqual(trace.termination.pc, 42, "termination pc");
  assert.strictEqual(trace.termination.gas, 9920n, "termination gas");
  assert.strictEqual(trace.termination.registers.get(0), 0x100n, "termination r00");
  assert.strictEqual(trace.termination.registers.get(2), 0x4n, "termination r02");

  console.log("PASS: spec example round-trip");
}

// Test: PANIC=0 (argument must always be present)
{
  const input = ["program 0x00", "start pc=0 gas=100", "PANIC=0 pc=5 gas=50 r00=0x1"].join("\n");

  const trace = parseTrace(input);
  assert.strictEqual(trace.termination.type, "PANIC", "panic type");
  assert.strictEqual(trace.termination.panicArg, 0, "panic arg is 0");
  assert.strictEqual(trace.termination.pc, 5, "panic pc");
  assert.strictEqual(trace.termination.gas, 50n, "panic gas");

  console.log("PASS: PANIC=0");
}

// Test: PANIC with non-zero argument
{
  const input = ["program 0x00", "start pc=0 gas=100", "PANIC=42 pc=10 gas=0"].join("\n");

  const trace = parseTrace(input);
  assert.strictEqual(trace.termination.panicArg, 42, "panic arg 42");
  assert.strictEqual(trace.termination.registers.size, 0, "no registers");

  console.log("PASS: PANIC=42");
}

// Test: OOG termination
{
  const input = ["program 0x00", "start pc=0 gas=100", "OOG pc=99 gas=0"].join("\n");

  const trace = parseTrace(input);
  assert.strictEqual(trace.termination.type, "OOG", "OOG type");
  assert.strictEqual(trace.termination.gas, 0n, "OOG gas is 0");

  console.log("PASS: OOG");
}

// Test: lines with log prefixes are handled (extractPayload)
{
  const input = [
    "TRACE [ecalli] program 0xaa",
    "TRACE [ecalli] start pc=0 gas=500 r00=0x1",
    "TRACE [ecalli] HALT pc=10 gas=400",
  ].join("\n");

  const trace = parseTrace(input);
  assert.deepStrictEqual(Array.from(trace.program), [0xaa], "prefixed program");
  assert.strictEqual(trace.start.registers.get(0), 0x1n, "prefixed start r00");
  assert.strictEqual(trace.termination.type, "HALT", "prefixed halt");

  console.log("PASS: log-prefixed lines");
}

// Test: comment lines are ignored
{
  const input = [
    "comment implementation typeberry 0.8.3",
    "comment chain-id fluffy-testnet",
    "program 0xbb",
    "comment accumulate",
    "start pc=0 gas=100",
    "HALT pc=5 gas=90",
  ].join("\n");

  const trace = parseTrace(input);
  assert.deepStrictEqual(Array.from(trace.program), [0xbb], "comment lines ignored");

  console.log("PASS: comment lines ignored");
}

// Test: zero-padded register indices in register dump
{
  const input = ["program 0x00", "start pc=0 gas=100 r00=0xff r12=0x1", "HALT pc=5 gas=90 r00=0xff r12=0x1"].join("\n");

  const trace = parseTrace(input);
  assert.strictEqual(trace.start.registers.get(0), 0xffn, "r00 parsed");
  assert.strictEqual(trace.start.registers.get(12), 0x1n, "r12 parsed");

  console.log("PASS: zero-padded register indices");
}

// Test: empty register dump (all zeros)
{
  const input = ["program 0x00", "start pc=0 gas=100", "HALT pc=5 gas=90"].join("\n");

  const trace = parseTrace(input);
  assert.strictEqual(trace.start.registers.size, 0, "empty register dump");
  assert.strictEqual(trace.termination.registers.size, 0, "empty termination registers");

  console.log("PASS: empty register dump");
}

// Test: multiple ecalli entries
{
  const input = [
    "program 0x00",
    "start pc=0 gas=10000",
    "ecalli=1 pc=10 gas=9000 r00=0x1",
    "setreg r00 <- 0x2",
    "ecalli=2 pc=20 gas=8000 r00=0x2",
    "memwrite 0x00001000 len=1 <- 0xff",
    "setgas <- 7900",
    "HALT pc=30 gas=7800",
  ].join("\n");

  const trace = parseTrace(input);
  assert.strictEqual(trace.ecalliEntries.length, 2, "two ecalli entries");
  assert.strictEqual(trace.ecalliEntries[0].index, 1, "first ecalli index");
  assert.strictEqual(trace.ecalliEntries[0].setRegs.length, 1, "first ecalli setregs");
  assert.strictEqual(trace.ecalliEntries[0].setGas, undefined, "first ecalli no setgas");
  assert.strictEqual(trace.ecalliEntries[1].index, 2, "second ecalli index");
  assert.strictEqual(trace.ecalliEntries[1].memWrites.length, 1, "second ecalli memwrites");
  assert.strictEqual(trace.ecalliEntries[1].setGas, 7900n, "second ecalli setgas");

  console.log("PASS: multiple ecalli entries");
}

// Test: missing program throws
assert.throws(() => parseTrace("start pc=0 gas=100\nHALT pc=5 gas=90"), /Missing program/, "missing program");
console.log("PASS: missing program throws");

// Test: missing start throws
assert.throws(() => parseTrace("program 0x00\nHALT pc=5 gas=90"), /Missing start/, "missing start");
console.log("PASS: missing start throws");

// Test: missing termination throws
assert.throws(() => parseTrace("program 0x00\nstart pc=0 gas=100"), /Missing termination/, "missing termination");
console.log("PASS: missing termination throws");

console.log("\nAll trace format tests passed.");
