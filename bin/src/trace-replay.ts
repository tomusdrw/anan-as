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
import { LOG_HOST_CALL_INDEX, printLogHostCall } from "./log-host-call.js";
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
import { ConsoleTracer, Tracer } from "./tracer.js";
import { hexEncode } from "./utils.js";

type ReplayOptions = {
  logs: boolean;
  hasMetadata: HasMetadata;
  verify: boolean;
  logHostCall?: boolean;
  tracer?: Tracer;
  useBlockGas?: boolean;
};

export function replayTraceFile(filePath: string, options: ReplayOptions): TraceSummary {
  const input = readFileSync(filePath, "utf8");
  const trace = parseTrace(input);

  const { program, initialMemWrites, start, ecalliEntries, termination } = trace;

  const hasMetadata = options.hasMetadata;
  const useSpi = isSpiTrace(start, initialMemWrites);
  const programInput = Array.from(program);
  const spiArgs = Array.from(extractSpiArgs(start, initialMemWrites));

  const preparedProgram = useSpi
    ? prepareProgram(InputKind.SPI, hasMetadata, programInput, [], [], [], spiArgs, 128)
    : prepareProgram(
        InputKind.Generic,
        hasMetadata,
        programInput,
        encodeRegistersFromDump(start.registers),
        buildInitialPages(initialMemWrites),
        buildInitialChunks(initialMemWrites),
        [],
        128,
      );

  const id = pvmStart(preparedProgram, true, options.useBlockGas ?? false);
  const initialEcalliCount = ecalliEntries.length;
  const tracer = options.tracer ?? new ConsoleTracer();

  try {
    let gas = start.gas;
    let pc = start.pc;

    // Print start line
    tracer.start(pc, gas, start.registers);
    if (spiArgs.length > 0) {
      tracer.spiArgs(ARGS_SEGMENT_START, spiArgs);
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
        tracer.ecalli(expectedEcalli.index, pause.pc, pause.gas, pause.registers);

        // Print log message for JIP-1 log host call
        if (pause.exitCode === LOG_HOST_CALL_INDEX && options.logHostCall) {
          printLogHostCall(id, pause.registers);
        }

        if (options.verify) {
          assertEq(pause.exitCode, expectedEcalli.index, "ecalli index");
          assertEq(pause.pc, expectedEcalli.pc, "ecalli pc");
          assertEq(pause.gas, expectedEcalli.gas, "ecalli gas");
          assertRegisters(pause.registers, expectedEcalli.registers);
        }

        // Print and verify memreads
        for (const read of expectedEcalli.memReads) {
          tracer.memread(read.address, read.data);
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
          tracer.memwrite(write.address, write.data);
          const written = pvmWriteMemory(id, write.address, write.data);
          if (!written) {
            throw new Error(`Failed to write memory at 0x${write.address.toString(16)} for PVM ${id}`);
          }
        }

        // Apply register writes
        const regs = pause.registers;
        for (const setReg of expectedEcalli.setRegs) {
          tracer.setreg(setReg.index, setReg.value);
          regs[setReg.index] = setReg.value;
        }
        pvmSetRegisters(id, regs);

        // Update gas
        if (expectedEcalli.setGas !== undefined) {
          tracer.setgas(expectedEcalli.setGas);
          gas = expectedEcalli.setGas;
        } else {
          gas = pause.gas;
        }

        // Advance PC
        pc = pause.nextPc;
      } else {
        // Termination
        const type = statusToTermination(pause.status);

        tracer.termination(type, pause.exitCode, pause.pc, pause.gas, pause.registers);

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
  const actualString = hexEncode(actual);
  const expectedString = hexEncode(expected);
  assertEq(actualString, expectedString, label);
}
