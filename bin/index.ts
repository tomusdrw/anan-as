#!/usr/bin/env node

import { readFileSync } from "node:fs";
import minimist, { ParsedArgs } from "minimist";
import { disassemble, HasMetadata, InputKind, prepareProgram, runProgram } from "../build/release.js";

const HELP_TEXT = `Usage:
  anan-as disassemble [--spi] [--no-metadata] <file.(jam|pvm|spi|bin)>
  anan-as run [--spi] [--no-logs] [--no-metadata] [--pc <number>] [--gas <number>] <file.jam> [spi-args.bin or hex]

Commands:
  disassemble  Disassemble PVM bytecode to assembly
  run          Execute PVM bytecode

Flags:
  --spi          Treat input as JAM SPI format
  --no-metadata  Input does not contain metadata
  --no-logs      Disable execution logs (run command only)
  --pc <number>  Set initial program counter (default: 0)
  --gas <number> Set initial gas amount (default: 10_000)
  --help, -h     Show this help message`;

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
    default:
      console.error(`Error: Unknown sub-command '${subCommand}'`);
      console.error("");
      console.error(HELP_TEXT);
      process.exit(1);
  }
}

function handleDisassemble(args: string[]) {
  const parsed = minimist(args, {
    boolean: ["spi", "no-metadata", "help"],
    alias: { h: "help" },
  });

  if (parsed.help) {
    console.log(HELP_TEXT);
    return;
  }

  const files = parsed._;
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

  const kind = parsed.spi ? InputKind.SPI : InputKind.Generic;
  const hasMetadata = parsed["no-metadata"] ? HasMetadata.No : HasMetadata.Yes;

  const f = readFileSync(file);
  const name = kind === InputKind.Generic ? "generic PVM" : "JAM SPI";
  console.log(`🤖 Assembly of ${file} (as ${name})`);
  console.log(disassemble(Array.from(f), kind, hasMetadata));
}

function handleRun(args: string[]) {
  const parsed = minimist(args, {
    boolean: ["spi", "no-logs", "no-metadata", "help"],
    /** Prevents parsing hex values as numbers. */
    string: ["pc", "gas", "_"],
    alias: { h: "help" },
  });

  if (parsed.help) {
    console.log(HELP_TEXT);
    return;
  }

  const files = parsed._;
  if (files.length === 0) {
    console.error("Error: No file provided for run command.");
    console.error(
      "Usage: anan-as run [--spi] [--no-logs] [--no-metadata] [--pc <number>] [--gas <number>] <file.jam> [spi-args.bin]",
    );
    process.exit(1);
  }

  const kind = parsed.spi ? InputKind.SPI : InputKind.Generic;

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

  const logs = !parsed["no-logs"];
  const hasMetadata = parsed["no-metadata"] ? HasMetadata.No : HasMetadata.Yes;

  // Parse and validate PC and gas options
  const initialPc = parsePc(parsed);
  const initialGas = parseGas(parsed);

  const programCode = Array.from(readFileSync(programFile));
  const name = kind === InputKind.Generic ? "generic PVM" : "JAM SPI";
  console.log(`🚀 Running ${programFile} (as ${name})`);

  try {
    const program = prepareProgram(kind, hasMetadata, programCode, [], [], [], spiArgs);
    const result = runProgram(program, initialGas, initialPc, logs, false);

    console.log(`Status: ${result.status}`);
    console.log(`Exit code: ${result.exitCode}`);
    console.log(`Program counter: ${result.pc}`);
    console.log(`Gas remaining: ${result.gas}`);
    console.log(`Registers: [${result.registers.join(", ")}]`);
    console.log(`Result: [${hexEncode(result.result)}]`);
  } catch (error) {
    console.error(`Error running ${programFile}:`, error);
    process.exit(1);
  }
}

function parseGas(parsed: ParsedArgs) {
  if (parsed.gas === undefined) {
    return BigInt(10_000);
  }

  // Ensure it's a string/number, not boolean
  if (typeof parsed.gas === "boolean") {
    console.error("Error: --gas requires a value.");
    process.exit(1);
  }

  const gasStr = String(parsed.gas);
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

function parsePc(parsed: ParsedArgs) {
  if (parsed.pc === undefined) {
    return 0;
  }

  // Ensure it's a string/number, not boolean
  if (typeof parsed.pc === "boolean") {
    console.error("Error: --pc requires a value.");
    process.exit(1);
  }

  const pcStr = String(parsed.pc);
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

function hexEncode(result: number[]) {
  return `0x${result.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

function hexDecode(data: string) {
  if (!data.startsWith("0x")) {
    throw new Error("hex input must start with 0x");
  }

  const hex = data.substring(2);
  const len = hex.length;
  if (len % 2 === 1) {
    throw new Error("Odd number of nibbles");
  }

  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    const c = hex.substring(i, i + 2);
    bytes[i / 2] = Number(`0x${c}`);
  }

  return bytes;
}
