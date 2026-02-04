import { readFileSync } from "node:fs";
import {
  HasMetadata,
  InputKind,
  prepareProgram,
  pvmDestroy,
  pvmReadMemory,
  pvmResume,
  pvmSetRegisters,
  pvmStart,
  pvmWriteMemory,
} from "../../build/release.js";
import {
  ARGS_SEGMENT_START,
  buildInitialChunks,
  buildInitialPages,
  encodeRegistersFromDump,
  extractSpiArgs,
  isSpiTrace,
  parseTrace,
  STATUS,
  statusToTermination,
  TraceSummary,
} from "./trace-parse.js";
import { hexEncode } from "./utils.js";

type ReplayOptions = {
  logs: boolean;
  hasMetadata: number;
  verify: boolean;
};

export function replayTraceFile(filePath: string, options: ReplayOptions): TraceSummary {
  const input = readFileSync(filePath, "utf8");
  const trace = parseTrace(input);

  const { program, initialMemWrites, start, ecalliEntries, termination } = trace;

  const hasMetadata = options.hasMetadata === 0 ? HasMetadata.Yes : HasMetadata.No;
  const useSpi = isSpiTrace(start, initialMemWrites);
  const programInput = Array.from(program);
  const spiArgs = Array.from(extractSpiArgs(start, initialMemWrites));

  const preparedProgram = useSpi
    ? prepareProgram(InputKind.SPI, hasMetadata, programInput, [], [], [], spiArgs)
    : prepareProgram(
        InputKind.Generic,
        hasMetadata,
        programInput,
        encodeRegistersFromDump(start.registers),
        buildInitialPages(initialMemWrites),
        buildInitialChunks(initialMemWrites),
        [],
      );

  const id = pvmStart(preparedProgram, true);
  const initialEcalliCount = ecalliEntries.length;

  try {
    let gas = start.gas;
    let pc = start.pc;

    // Print start line
    console.log(`start pc=${pc} gas=${gas} ${formatRegisters(start.registers)}`);
    if (spiArgs.length > 0) {
      console.log(`  memwrite ${ARGS_SEGMENT_START} len=${spiArgs.length} <- ${hexEncode(spiArgs)}`);
    }

    for (;;) {
      const pause = pvmResume(id, gas, pc, options.logs);

      if (!pause) {
        throw new Error("pvmResume returned null");
      }

      if (pause.status === STATUS.HOST) {
        const expectedEcalli = ecalliEntries.shift();
        if (!expectedEcalli) {
          throw new Error("Unexpected host call");
        }

        // Print ecalli line
        console.log(
          `\necalli=${expectedEcalli.index} pc=${pause.pc} gas=${pause.gas} ${formatRegisters(pause.registers)}`,
        );

        if (options.verify) {
          assertEq(pause.exitCode, expectedEcalli.index, "ecalli index");
          assertEq(pause.pc, expectedEcalli.pc, "ecalli pc");
          assertEq(pause.gas, expectedEcalli.gas, "ecalli gas");
          assertRegisters(pause.registers, expectedEcalli.registers);
        }

        // Print and verify memreads
        for (const read of expectedEcalli.memReads) {
          console.log(`  memread 0x${read.address.toString(16)} len=${read.data.length} -> ${formatHex(read.data)}`);
          if (options.verify) {
            const actualData = pvmReadMemory(id, read.address, read.data.length);
            if (!actualData) {
              throw new Error(`Failed to read memory at 0x${read.address.toString(16)}`);
            }
            assertMemEq(actualData, read.data, `memread at 0x${read.address.toString(16)}`);
          }
        }

        // Apply memory writes
        for (const write of expectedEcalli.memWrites) {
          console.log(
            `  memwrite 0x${write.address.toString(16)} len=${write.data.length} <- ${formatHex(write.data)}`,
          );
          pvmWriteMemory(id, write.address, write.data);
        }

        // Apply register writes
        const regs = pause.registers;
        for (const setReg of expectedEcalli.setRegs) {
          console.log(`  setreg r${setReg.index.toString().padStart(2, "0")} <- 0x${setReg.value.toString(16)}`);
          regs[setReg.index] = setReg.value;
        }
        pvmSetRegisters(id, regs);

        // Update gas
        if (expectedEcalli.setGas !== undefined) {
          console.log(`  setgas <- ${expectedEcalli.setGas}`);
          gas = expectedEcalli.setGas;
        } else {
          gas = pause.gas;
        }

        // Advance PC
        pc = pause.nextPc;
      } else {
        // Termination
        const type = statusToTermination(pause.status);

        let termLine = `\n------\n${type}`;
        if (type === "PANIC" && pause.exitCode !== 0) {
          termLine += `=${pause.exitCode}`;
        }
        termLine += ` pc=${pause.pc} gas=${pause.gas} ${formatRegisters(pause.registers)}`;
        console.log(termLine);

        if (options.verify) {
          assertEq(ecalliEntries.length, 0, "more host calls expected!");
          assertEq(type, termination.type, "termination type");
          assertEq(pause.pc, termination.pc, "termination pc");
          assertEq(pause.gas, termination.gas, "termination gas");
        }
        break;
      }
    }

    return {
      success: true,
      ecalliCount: initialEcalliCount,
      termination: trace.termination,
    };
  } finally {
    // after we are done, make sure to release resources
    pvmDestroy(id);
  }
}

function assertEq(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`\nMismatch ${label}:\n${expected} (expected)\n${actual} (got)`);
  }
}

function assertRegisters(actual: bigint[], expected: Map<number, bigint>) {
  for (let i = 0; i < actual.length; i++) {
    const actualValue = actual[i];
    const expectedValue = expected.get(i) ?? 0n;
    if (actualValue !== expectedValue) {
      throw new Error(
        `\nRegister mismatch r${i}:\n0x${expectedValue.toString(16)} (expected)\n0x${actualValue.toString(16)} (got)`,
      );
    }
  }
}

function assertMemEq(actual: Uint8Array, expected: Uint8Array, label: string) {
  const actualString = hexEncode(Array.from(actual));
  const expectedString = hexEncode(Array.from(expected));
  assertEq(actualString, expectedString, label);
}

function formatRegisters(registers: bigint[] | Map<number, bigint>): string {
  const entries: { idx: number; val: bigint }[] = [];
  if (Array.isArray(registers)) {
    registers.forEach((val, idx) => {
      if (val !== 0n) entries.push({ idx, val });
    });
  } else {
    for (const [idx, val] of registers) {
      if (val !== 0n) entries.push({ idx, val });
    }
  }

  return entries
    .sort((a, b) => a.idx - b.idx)
    .map((e) => `r${e.idx}=0x${e.val.toString(16)}`)
    .join(" ");
}

function formatHex(data: Uint8Array): string {
  return `0x${Buffer.from(data).toString("hex")}`;
}
