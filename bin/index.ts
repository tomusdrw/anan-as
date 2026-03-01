#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  disassemble,
  HasMetadata,
  InputKind,
  prepareProgram,
  pvmDestroy,
  pvmResume,
  pvmSetRegisters,
  pvmStart,
} from "../build/release.js";
import { LOG_GAS_COST, LOG_HOST_CALL_INDEX, printLogHostCall, WHAT } from "./src/log-host-call.js";
import { STATUS } from "./src/trace-parse.js";
import { replayTraceFile } from "./src/trace-replay.js";
import { hexDecode, hexEncode } from "./src/utils.js";

const HELP_TEXT = `Usage:
  anan-as disassemble [--spi] [--no-metadata] <file.(jam|pvm|spi|bin)>
  anan-as run [--spi] [--no-logs] [--no-metadata] [--no-log-host-call] [--pc <number>] [--gas <number>] <file.jam> [spi-args.bin or hex]
  anan-as replay-trace [--no-metadata] [--no-verify] [--no-logs] [--no-log-host-call] <trace.log>

Commands:
  disassemble  Disassemble PVM bytecode to assembly
  run          Execute PVM bytecode
  replay-trace  Re-execute a ecalli IO trace

Flags:
  --spi               Treat input as JAM SPI format
  --no-metadata       Input does not contain metadata
  --no-logs           Disable execution logs
  --no-log-host-call  Disable built-in handling of JIP-1 log host call (ecalli 100)
  --no-verify         Skip verification against trace data (replay-trace only)
  --pc <number>       Set initial program counter (default: 0)
  --gas <number>      Set initial gas amount (default: 10_000)
  --help, -h          Show this help message`;

main();

function main() {
  const args = process.argv.slice(2);

  // Handle global help flags
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(HELP_TEXT);
    return;
  }

  const subCommand = args[0];

  switch (subCommand) {
    case "disassemble":
      handleDisassemble(args.slice(1));
      break;
    case "run":
      handleRun(args.slice(1));
      break;
    case "replay-trace":
      handleReplayTrace(args.slice(1));
      break;
    default:
      console.error(`Error: Unknown sub-command '${subCommand}'`);
      console.error("");
      console.error(HELP_TEXT);
      process.exit(1);
  }
}

function handleDisassemble(args: string[]) {
  const { values, positionals: files } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      spi: { type: "boolean", default: false },
      "no-metadata": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (files.length === 0) {
    console.error("Error: No file provided for disassemble command.");
    console.error("Usage: anan-as disassemble [--spi] [--no-metadata] <file.(jam|pvm|spi|bin)>");
    process.exit(1);
  }
  if (files.length > 1) {
    console.error("Error: Only one file can be disassembled at a time.");
    console.error("Usage: anan-as disassemble [--spi] [--no-metadata] <file.(jam|pvm|spi|bin)>");
    process.exit(1);
  }

  const file = files[0];

  // Validate file extension for disassemble command
  const validExtensions = [".jam", ".pvm", ".spi", ".bin"];
  const dotIndex = file.lastIndexOf(".");
  if (dotIndex === -1) {
    console.error(`Error: File '${file}' has no extension.`);
    console.error("Supported extensions: .jam, .pvm, .spi, .bin");
    process.exit(1);
  }
  const ext = file.substring(dotIndex);
  if (!validExtensions.includes(ext)) {
    console.error(`Error: Invalid file extension '${ext}' for disassemble command.`);
    console.error("Supported extensions: .jam, .pvm, .spi, .bin");
    process.exit(1);
  }

  const kind = values.spi ? InputKind.SPI : InputKind.Generic;
  const hasMetadata = values["no-metadata"] ? HasMetadata.No : HasMetadata.Yes;

  const f = readFileSync(file);
  const name = kind === InputKind.Generic ? "generic PVM" : "JAM SPI";
  console.log(`🤖 Assembly of ${file} (as ${name})`);
  console.log(disassemble(Array.from(f), kind, hasMetadata));
}

function handleRun(args: string[]) {
  const { values, positionals: files } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      spi: { type: "boolean", default: false },
      "no-logs": { type: "boolean", default: false },
      "no-metadata": { type: "boolean", default: false },
      "no-log-host-call": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
      pc: { type: "string" },
      gas: { type: "string" },
    },
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (files.length === 0) {
    console.error("Error: No file provided for run command.");
    console.error(
      "Usage: anan-as run [--spi] [--no-logs] [--no-metadata] [--pc <number>] [--gas <number>] <file.jam> [spi-args.bin]",
    );
    process.exit(1);
  }

  const kind = values.spi ? InputKind.SPI : InputKind.Generic;

  let programFile: string;
  let spiArgsStr: string | undefined;

  if (kind === InputKind.SPI) {
    // For SPI programs, expect: <program.spi> [spi-args.bin or hex]
    if (files.length > 2) {
      console.error("Error: Too many arguments for SPI run command.");
      console.error(
        "Usage: anan-as run --spi [--no-logs] [--no-metadata] [--pc <number>] [--gas <number>] <program.spi> [spi-args.bin or hex]",
      );
      process.exit(1);
    }
    programFile = files[0];
    spiArgsStr = files[1]; // optional
  } else {
    // For generic programs, expect exactly one file
    if (files.length > 1) {
      console.error("Error: Only one file can be run at a time.");
      console.error("Usage: anan-as run [--no-logs] [--no-metadata] [--pc <number>] [--gas <number>] <file.jam>");
      process.exit(1);
    }
    programFile = files[0];
  }

  // Validate SPI args file if provided
  const spiArgs = parseSpiArgs(spiArgsStr);

  const logs = !values["no-logs"];
  const logHostCall = !values["no-log-host-call"];
  const hasMetadata = values["no-metadata"] ? HasMetadata.No : HasMetadata.Yes;

  // Parse and validate PC and gas options
  const initialPc = parsePc(values.pc);
  const initialGas = parseGas(values.gas);

  const programCode = Array.from(readFileSync(programFile));
  const name = kind === InputKind.Generic ? "generic PVM" : "JAM SPI";
  console.log(`🚀 Running ${programFile} (as ${name})`);

  try {
    const preallocateMemoryPages = 128;
    const useBlockGas = false;
    const program = prepareProgram(
      kind,
      hasMetadata,
      programCode,
      [],
      [],
      [],
      spiArgs,
      preallocateMemoryPages,
      useBlockGas,
    );
    const id = pvmStart(program);
    let gas = initialGas;
    let pc = initialPc;

    for (;;) {
      const pause = pvmResume(id, gas, pc, logs);
      if (!pause) {
        throw new Error("pvmResume returned null");
      }

      if (pause.status === STATUS.HOST && pause.exitCode === LOG_HOST_CALL_INDEX && logHostCall) {
        printLogHostCall(id, pause.registers);

        // Set r7 = WHAT
        const regs = pause.registers;
        regs[7] = WHAT;
        pvmSetRegisters(id, regs);

        // Deduct gas and advance PC
        gas = pause.gas >= LOG_GAS_COST ? pause.gas - LOG_GAS_COST : 0n;
        pc = pause.nextPc;
      } else {
        console.warn(`Unhandled host call: ecalli ${pause.exitCode}. Finishing.`);
        break;
      }
    }

    const result = pvmDestroy(id);
    console.log(`Status: ${result?.status}`);
    console.log(`Exit code: ${result?.exitCode}`);
    console.log(`Program counter: ${result?.pc}`);
    console.log(`Gas remaining: ${result?.gas}`);
    console.log(`Registers: [${result?.registers.join(", ")}]`);
    console.log(`Result: [${hexEncode(result?.result ?? [])}]`);
  } catch (error) {
    console.error(`Error running ${programFile}:`, error);
    process.exit(1);
  }
}

function handleReplayTrace(args: string[]) {
  const { values, positionals: files } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      "no-metadata": { type: "boolean", default: false },
      "no-verify": { type: "boolean", default: false },
      "no-logs": { type: "boolean", default: false },
      "no-log-host-call": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(HELP_TEXT);
    return;
  }

  if (files.length === 0) {
    console.error("Error: No trace file provided for replay-trace command.");
    console.error("Usage: anan-as replay-trace [--no-metadata] [--no-verify] [--no-logs] <trace.log>");
    process.exit(1);
  }
  if (files.length > 1) {
    console.error("Error: Only one trace file can be replayed at a time.");
    console.error("Usage: anan-as replay-trace [--no-metadata] [--no-verify] [--no-logs] <trace.log>");
    process.exit(1);
  }

  const file = files[0];
  const hasMetadata = values["no-metadata"] ? HasMetadata.No : HasMetadata.Yes;
  const verify = !values["no-verify"];
  const logs = !values["no-logs"];
  const logHostCall = !values["no-log-host-call"];

  try {
    const summary = replayTraceFile(file, {
      logs,
      hasMetadata,
      verify,
      logHostCall,
    });

    console.log(`✅ Replay complete: ${summary.ecalliCount} ecalli entries`);
    console.log(`Status: ${summary.termination.type}`);
    console.log(`Program counter: ${summary.termination.pc}`);
    console.log(`Gas remaining: ${summary.termination.gas}`);
  } catch (error) {
    console.error(`Error replaying trace ${file}:`, error);
    process.exit(1);
  }
}

function parseGas(gasStr?: string): bigint {
  if (gasStr === undefined) {
    return BigInt(10_000);
  }

  // Reject floats and non-integer strings
  if (gasStr.includes(".") || !/^-?\d+$/.test(gasStr)) {
    console.error("Error: --gas must be a valid integer.");
    process.exit(1);
  }

  let gasValue: bigint;
  try {
    gasValue = BigInt(gasStr);
  } catch (_e) {
    console.error("Error: --gas must be a valid integer.");
    process.exit(1);
  }

  const MAX_I64 = (1n << 63n) - 1n;
  if (gasValue < 0n || gasValue > MAX_I64) {
    console.error("Error: --gas must be a non-negative integer <= 2^63-1.");
    process.exit(1);
  }
  return gasValue;
}

function parseSpiArgs(spiArgsStr?: string): number[] {
  if (!spiArgsStr) {
    return [];
  }

  try {
    return Array.from(hexDecode(spiArgsStr));
  } catch (e) {
    console.log(`Attempting to read ${spiArgsStr} as a file, since it's not a hex value: ${e}`);
    return Array.from(readFileSync(spiArgsStr));
  }
}

function parsePc(pcStr?: string): number {
  if (pcStr === undefined) {
    return 0;
  }

  // Reject floats and non-integer strings
  if (pcStr.includes(".") || !/^-?\d+$/.test(pcStr)) {
    console.error("Error: --pc must be a valid integer.");
    process.exit(1);
  }

  const pcValue = parseInt(pcStr, 10);
  if (!Number.isInteger(pcValue) || pcValue < 0 || pcValue > 0xffffffff) {
    console.error("Error: --pc must be a non-negative integer <= 2^32-1.");
    process.exit(1);
  }
  return pcValue;
}
