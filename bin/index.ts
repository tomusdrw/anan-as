#!/usr/bin/env node

import { readFileSync } from "node:fs";
import minimist from "minimist";
import { disassemble, HasMetadata, InputKind, prepareProgram, runProgram } from "../build/release.js";

const HELP_TEXT = `Usage:
  anan-as disassemble [--spi] [--no-metadata] <file.(jam|pvm|spi|bin)>
  anan-as run [--spi] [--no-logs] [--no-metadata] [--pc <number>] [--gas <number>] <file.jam> [spi-args.bin]

Commands:
  disassemble  Disassemble PVM bytecode to assembly
  run          Execute PVM bytecode

Flags:
  --spi          Treat input as JAM SPI format
  --no-metadata  Input does not contain metadata
  --no-logs      Disable execution logs (run command only)
  --pc <number>  Set initial program counter (default: 0)
  --gas <number> Set initial gas amount (default: 0)
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
    string: ["pc", "gas"],
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
  let spiArgsFile: string | undefined;

  if (kind === InputKind.SPI) {
    // For SPI programs, expect: <program.spi> [spi-args.bin]
    if (files.length > 2) {
      console.error("Error: Too many arguments for SPI run command.");
      console.error(
        "Usage: anan-as run --spi [--no-logs] [--no-metadata] [--pc <number>] [--gas <number>] <program.spi> [spi-args.bin]",
      );
      process.exit(1);
    }
    programFile = files[0];
    spiArgsFile = files[1]; // optional
  } else {
    // For generic programs, expect exactly one file
    if (files.length > 1) {
      console.error("Error: Only one file can be run at a time.");
      console.error("Usage: anan-as run [--no-logs] [--no-metadata] [--pc <number>] [--gas <number>] <file.jam>");
      process.exit(1);
    }
    programFile = files[0];
  }

  // Validate program file extension
  const expectedExt = kind === InputKind.SPI ? ".spi" : ".jam";
  const dotIndex = programFile.lastIndexOf(".");
  if (dotIndex === -1) {
    console.error(`Error: File '${programFile}' has no extension.`);
    console.error(`Expected: ${expectedExt}`);
    process.exit(1);
  }
  const ext = programFile.substring(dotIndex);
  if (ext !== expectedExt) {
    console.error(`Error: Invalid file extension '${ext}' for run command.`);
    console.error(`Expected: ${expectedExt}`);
    process.exit(1);
  }

  // Validate SPI args file if provided
  let spiArgs: Uint8Array | undefined;
  if (spiArgsFile) {
    const argsDotIndex = spiArgsFile.lastIndexOf(".");
    if (argsDotIndex === -1) {
      console.error(`Error: SPI args file '${spiArgsFile}' has no extension.`);
      console.error(`Expected: .bin`);
      process.exit(1);
    }
    const argsExt = spiArgsFile.substring(argsDotIndex);
    if (argsExt !== ".bin") {
      console.error(`Error: SPI args file must have .bin extension, got '${argsExt}'.`);
      process.exit(1);
    }
    spiArgs = new Uint8Array(readFileSync(spiArgsFile));
  }

  const logs = !parsed["no-logs"];
  const hasMetadata = parsed["no-metadata"] ? HasMetadata.No : HasMetadata.Yes;

  // Parse and validate PC and gas options
  let initialPc = 0;
  if (parsed.pc !== undefined) {
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
    initialPc = pcValue;
  }

  let initialGas = BigInt(0);
  if (parsed.gas !== undefined) {
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
    initialGas = gasValue;
  }

  const f = readFileSync(programFile);
  const name = kind === InputKind.Generic ? "generic PVM" : "JAM SPI";
  console.log(`🚀 Running ${programFile} (as ${name})`);

  try {
    const program = prepareProgram(kind, hasMetadata, Array.from(f), [], [], [], spiArgs ? Array.from(spiArgs) : []);
    const result = runProgram(program, initialGas, initialPc, logs, false);

    console.log(`Status: ${result.status}`);
    console.log(`Exit code: ${result.exitCode}`);
    console.log(`Program counter: ${result.pc}`);
    console.log(`Gas remaining: ${result.gas}`);
    console.log(`Registers: [${result.registers.join(", ")}]`);
  } catch (error) {
    console.error(`Error running ${programFile}:`, error);
    process.exit(1);
  }
}
