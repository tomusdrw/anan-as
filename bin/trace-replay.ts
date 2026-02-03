import { readFileSync } from "node:fs";
import { HasMetadata, InputKind, prepareProgram, runProgram } from "../build/release.js";

const NO_OF_REGISTERS = 13;

const STATUS = {
  OK: 255,
  HALT: 0,
  PANIC: 1,
  FAULT: 2,
  HOST: 3,
  OOG: 4,
} as const;

const ARGS_SEGMENT_START = 0xfeff0000;

type ReplayOptions = {
  hasMetadata: number;
  verify: boolean;
};

type TraceSummary = {
  ecalliCount: number;
  termination: {
    type: "HALT" | "OOG" | "PANIC";
    pc: number;
    gas: bigint;
    panicArg?: number;
  };
};

type RegisterDump = Map<number, bigint>;

type MemWrite = {
  address: number;
  data: Uint8Array;
};

type MemRead = {
  address: number;
  data: Uint8Array;
};

type EcalliEntry = {
  index: number;
  pc: number;
  gas: bigint;
  registers: RegisterDump;
  memReads: MemRead[];
  memWrites: MemWrite[];
  setRegs: Array<{ index: number; value: bigint }>;
  setGas?: bigint;
};

type TraceData = {
  program: Uint8Array;
  initialMemWrites: MemWrite[];
  start: {
    pc: number;
    gas: bigint;
    registers: RegisterDump;
  };
  ecalliEntries: EcalliEntry[];
  termination: {
    type: "HALT" | "OOG" | "PANIC";
    pc: number;
    gas: bigint;
    registers: RegisterDump;
    panicArg?: number;
  };
};

const LINE_PATTERN =
  /(program\s+0x|memwrite\s+0x|start\s+pc=|ecalli=\d+|memread\s+0x|setreg\s+r\d+|setgas\s+<-|HALT\s+pc=|OOG\s+pc=|PANIC=)/;

export function replayTraceFile(filePath: string, options: ReplayOptions): TraceSummary {
  const input = readFileSync(filePath, "utf8");
  const trace = parseTrace(input);

  if (!options.verify) {
    return replayTraceStateless(trace);
  }

  const { program, initialMemWrites, start, ecalliEntries, termination } = trace;

  const hasMetadata = options.hasMetadata === 0 ? HasMetadata.Yes : HasMetadata.No;
  const useSpi = isSpiTrace(start, initialMemWrites);
  const programInput = Array.from(program);

  const execution = useSpi
    ? runProgram(
        prepareProgram(
          InputKind.SPI,
          hasMetadata,
          programInput,
          [],
          [],
          [],
          Array.from(extractSpiArgs(start, initialMemWrites)),
        ),
        start.gas,
        start.pc,
        false,
        false,
      )
    : runProgram(
        prepareProgram(
          InputKind.Generic,
          hasMetadata,
          programInput,
          encodeRegistersFromDump(start.registers),
          buildInitialPages(initialMemWrites),
          buildInitialChunks(initialMemWrites),
          [],
        ),
        start.gas,
        start.pc,
        false,
        false,
      );

  if (ecalliEntries.length > 0) {
    if (execution.status !== STATUS.HOST) {
      throw new Error(`Expected host call, got status ${execution.status}`);
    }
    assertEq(execution.exitCode, ecalliEntries[0].index, "ecalli index");
    if (ecalliEntries.length > 1) {
      throw new Error("runProgram cannot replay multiple host calls; use verify=false for stateless replay");
    }
  } else {
    const expected = termination.type;
    const actual = statusToTermination(execution.status);
    if (expected !== actual) {
      throw new Error(`Termination mismatch: expected ${expected}, got ${actual}`);
    }
    if (termination.type === "PANIC" && termination.panicArg !== undefined) {
      assertEq(execution.exitCode, termination.panicArg, "panic arg");
    }
  }

  const summary: TraceSummary = {
    ecalliCount: ecalliEntries.length,
    termination: {
      type: termination.type,
      pc: termination.pc,
      gas: termination.gas,
      panicArg: termination.panicArg,
    },
  };

  return summary;
}

function replayTraceStateless(trace: TraceData): TraceSummary {
  const memory = new Map<number, number>();
  const registers = new Map<number, bigint>(trace.start.registers);

  for (const write of trace.initialMemWrites) {
    writeBytes(memory, write.address, write.data);
  }

  for (const entry of trace.ecalliEntries) {
    for (const write of entry.memWrites) {
      writeBytes(memory, write.address, write.data);
    }

    for (const { index, value } of entry.setRegs) {
      registers.set(index, value);
    }

    if (entry.setGas !== undefined) {
      // gas is tracked in the trace, no VM state update needed for stateless replay.
      void entry.setGas;
    }
  }

  return {
    ecalliCount: trace.ecalliEntries.length,
    termination: {
      type: trace.termination.type,
      pc: trace.termination.pc,
      gas: trace.termination.gas,
      panicArg: trace.termination.panicArg,
    },
  };
}

function writeBytes(memory: Map<number, number>, address: number, data: Uint8Array) {
  for (let i = 0; i < data.length; i++) {
    memory.set(address + i, data[i]);
  }
}

function parseTrace(input: string): TraceData {
  const lines = input.split(/\r?\n/);
  let program: Uint8Array | null = null;
  const initialMemWrites: MemWrite[] = [];
  let start: TraceData["start"] | null = null;
  const ecalliEntries: EcalliEntry[] = [];
  let currentEntry: EcalliEntry | null = null;
  let termination: TraceData["termination"] | null = null;

  for (const rawLine of lines) {
    const line = extractPayload(rawLine);
    if (!line) {
      continue;
    }

    if (line.startsWith("program ")) {
      program = parseHexBytes(line.replace("program ", "").trim());
      continue;
    }

    if (line.startsWith("memwrite ")) {
      const memwrite = parseMemWrite(line);
      if (currentEntry) {
        currentEntry.memWrites.push(memwrite);
      } else {
        initialMemWrites.push(memwrite);
      }
      continue;
    }

    if (line.startsWith("start ")) {
      start = parseStart(line);
      continue;
    }

    if (line.startsWith("ecalli=")) {
      const entry = parseEcalli(line);
      ecalliEntries.push(entry);
      currentEntry = entry;
      continue;
    }

    if (line.startsWith("memread ")) {
      if (!currentEntry) {
        throw new Error(`memread without active ecalli: ${line}`);
      }
      currentEntry.memReads.push(parseMemRead(line));
      continue;
    }

    if (line.startsWith("setreg ")) {
      if (!currentEntry) {
        throw new Error(`setreg without active ecalli: ${line}`);
      }
      const setReg = parseSetReg(line);
      currentEntry.setRegs.push(setReg);
      continue;
    }

    if (line.startsWith("setgas ")) {
      if (!currentEntry) {
        throw new Error(`setgas without active ecalli: ${line}`);
      }
      currentEntry.setGas = parseSetGas(line);
      continue;
    }

    if (line.startsWith("HALT ") || line.startsWith("OOG ") || line.startsWith("PANIC=")) {
      termination = parseTermination(line);
      currentEntry = null;
    }
  }

  if (!program) {
    throw new Error("Missing program line in trace");
  }
  if (!start) {
    throw new Error("Missing start line in trace");
  }
  if (!termination) {
    throw new Error("Missing termination line in trace");
  }

  return {
    program,
    initialMemWrites,
    start,
    ecalliEntries,
    termination,
  };
}

function extractPayload(line: string): string | null {
  const match = LINE_PATTERN.exec(line);
  if (!match || match.index === undefined) {
    return null;
  }
  return line.slice(match.index).trim();
}

function parseStart(line: string): TraceData["start"] {
  const match = /^start pc=(\d+) gas=(\d+)(.*)$/.exec(line);
  if (!match) {
    throw new Error(`Invalid start line: ${line}`);
  }
  return {
    pc: parseInt(match[1], 10),
    gas: BigInt(match[2]),
    registers: parseRegisterDump(match[3]),
  };
}

function parseEcalli(line: string): EcalliEntry {
  const match = /^ecalli=(\d+) pc=(\d+) gas=(\d+)(.*)$/.exec(line);
  if (!match) {
    throw new Error(`Invalid ecalli line: ${line}`);
  }
  return {
    index: parseInt(match[1], 10),
    pc: parseInt(match[2], 10),
    gas: BigInt(match[3]),
    registers: parseRegisterDump(match[4]),
    memReads: [],
    memWrites: [],
    setRegs: [],
  };
}

function parseMemWrite(line: string): MemWrite {
  const match = /^memwrite\s+0x([0-9a-f]+)\s+len=(\d+)\s+<-\s+0x([0-9a-f]+)$/i.exec(line);
  if (!match) {
    throw new Error(`Invalid memwrite line: ${line}`);
  }
  const address = parseInt(match[1], 16);
  const data = parseHexBytes(`0x${match[3]}`);
  const len = parseInt(match[2], 10);
  if (data.length !== len) {
    throw new Error(`memwrite length mismatch: expected ${len}, got ${data.length}`);
  }
  return { address, data };
}

function parseMemRead(line: string): MemRead {
  const match = /^memread\s+0x([0-9a-f]+)\s+len=(\d+)\s+->\s+0x([0-9a-f]+)$/i.exec(line);
  if (!match) {
    throw new Error(`Invalid memread line: ${line}`);
  }
  const address = parseInt(match[1], 16);
  const data = parseHexBytes(`0x${match[3]}`);
  const len = parseInt(match[2], 10);
  if (data.length !== len) {
    throw new Error(`memread length mismatch: expected ${len}, got ${data.length}`);
  }
  return { address, data };
}

function parseSetReg(line: string) {
  const match = /^setreg\s+r(\d+)\s+<-\s+0x([0-9a-f]+)$/i.exec(line);
  if (!match) {
    throw new Error(`Invalid setreg line: ${line}`);
  }
  return {
    index: parseInt(match[1], 10),
    value: BigInt(`0x${match[2]}`),
  };
}

function parseSetGas(line: string): bigint {
  const match = /^setgas\s+<-\s+(\d+)$/i.exec(line);
  if (!match) {
    throw new Error(`Invalid setgas line: ${line}`);
  }
  return BigInt(match[1]);
}

function parseTermination(line: string): TraceData["termination"] {
  if (line.startsWith("HALT ")) {
    const match = /^HALT pc=(\d+) gas=(\d+)(.*)$/.exec(line);
    if (!match) {
      throw new Error(`Invalid HALT line: ${line}`);
    }
    return {
      type: "HALT",
      pc: parseInt(match[1], 10),
      gas: BigInt(match[2]),
      registers: parseRegisterDump(match[3]),
    };
  }
  if (line.startsWith("OOG ")) {
    const match = /^OOG pc=(\d+) gas=(\d+)(.*)$/.exec(line);
    if (!match) {
      throw new Error(`Invalid OOG line: ${line}`);
    }
    return {
      type: "OOG",
      pc: parseInt(match[1], 10),
      gas: BigInt(match[2]),
      registers: parseRegisterDump(match[3]),
    };
  }
  if (line.startsWith("PANIC=")) {
    const match = /^PANIC=([^\s]+) pc=(\d+) gas=(\d+)(.*)$/.exec(line);
    if (!match) {
      throw new Error(`Invalid PANIC line: ${line}`);
    }
    return {
      type: "PANIC",
      pc: parseInt(match[2], 10),
      gas: BigInt(match[3]),
      registers: parseRegisterDump(match[4]),
      panicArg: parseNumber(match[1]),
    };
  }

  throw new Error(`Unknown termination line: ${line}`);
}

function parseRegisterDump(input: string): RegisterDump {
  const dump = new Map<number, bigint>();
  const regex = /r(\d+)=0x([0-9a-f]+)/gi;
  for (const match of input.matchAll(regex)) {
    const index = parseInt(match[1], 10);
    const value = BigInt(`0x${match[2]}`);
    dump.set(index, value);
  }
  return dump;
}

function parseHexBytes(hex: string): Uint8Array {
  if (!hex.startsWith("0x")) {
    throw new Error(`Hex value must start with 0x: ${hex}`);
  }
  const data = hex.slice(2);
  if (data.length % 2 !== 0) {
    throw new Error(`Hex value must have even length: ${hex}`);
  }
  const bytes = new Uint8Array(data.length / 2);
  for (let i = 0; i < data.length; i += 2) {
    bytes[i / 2] = Number.parseInt(data.slice(i, i + 2), 16);
  }
  return bytes;
}

function encodeRegistersFromDump(dump: RegisterDump): bigint[] {
  const registers = new Array<bigint>(NO_OF_REGISTERS).fill(0n);
  for (const [index, value] of dump) {
    registers[index] = value;
  }
  return registers;
}

function buildInitialPages(memWrites: MemWrite[]) {
  return memWrites
    .filter((write) => write.data.length > 0)
    .map((write) => ({
      address: write.address,
      length: write.data.length,
      access: 2,
    }));
}

function buildInitialChunks(memWrites: MemWrite[]) {
  return memWrites
    .filter((write) => write.data.length > 0)
    .map((write) => ({
      address: write.address,
      data: Array.from(write.data),
    }));
}

function isSpiTrace(start: TraceData["start"], memWrites: MemWrite[]) {
  const r07 = start.registers.get(7);
  if (r07 !== undefined && r07 === BigInt(ARGS_SEGMENT_START)) {
    return true;
  }
  return memWrites.some((write) => write.address === ARGS_SEGMENT_START);
}

function extractSpiArgs(start: TraceData["start"], memWrites: MemWrite[]): Uint8Array {
  const argLen = Number(start.registers.get(8) ?? 0n);
  if (argLen <= 0) {
    return new Uint8Array(0);
  }
  const buffer = new Uint8Array(argLen);
  for (const write of memWrites) {
    if (write.address < ARGS_SEGMENT_START) {
      continue;
    }
    const offset = write.address - ARGS_SEGMENT_START;
    if (offset >= buffer.length) {
      continue;
    }
    buffer.set(write.data.subarray(0, buffer.length - offset), offset);
  }
  return buffer;
}

function statusToTermination(status: number): "HALT" | "OOG" | "PANIC" {
  if (status === STATUS.HALT) {
    return "HALT";
  }
  if (status === STATUS.OOG) {
    return "OOG";
  }
  return "PANIC";
}

function parseNumber(value: string): number {
  if (value.startsWith("0x")) {
    return Number.parseInt(value, 16);
  }
  return Number.parseInt(value, 10);
}

function assertEq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`Mismatch ${label}: expected ${expected}, got ${actual}`);
  }
}
