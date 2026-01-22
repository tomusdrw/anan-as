#!/usr/bin/env node

// @ts-ignore - minimist types issue with ESM
import minimist from 'minimist';
import { readFileSync } from 'node:fs';
import { InputKind, disassemble, HasMetadata, runProgram, prepareProgram } from "../build/release.js";

const HELP_TEXT = `Usage:
  anan-as disassemble [--spi] [--no-metadata] <file1.(jam|pvm|spi|bin)> [file2...]
  anan-as run [--spi] [--no-logs] [--no-metadata] <file1.jam> [file2...]

Commands:
  disassemble  Disassemble PVM bytecode to assembly
  run          Execute PVM bytecode

Flags:
  --spi          Treat input as JAM SPI format
  --no-metadata  Input does not contain metadata 
  --no-logs      Disable execution logs (run command only)
  --help, -h     Show this help message`;

main();

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Error: No sub-command provided.");
    console.error("");
    console.error(HELP_TEXT);
    process.exit(1);
  }

  const subCommand = args[0];

  switch (subCommand) {
    case 'disassemble':
      handleDisassemble(args.slice(1));
      break;
    case 'run':
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
    boolean: ['spi', 'no-metadata', 'help'],
    alias: { h: 'help' }
  });

  if (parsed.help) {
    console.log(HELP_TEXT);
    return;
  }

  const files = parsed._;
  if (files.length === 0) {
    console.error("Error: No files provided for disassemble command.");
    console.error("Usage: anan-as disassemble [--spi] [--no-metadata] <file1.(jam|pvm|spi|bin)> [file2...]");
    process.exit(1);
  }

  // Validate file extensions for disassemble command
  const validExtensions = ['.jam', '.pvm', '.spi', '.bin'];
  for (const file of files) {
    const dotIndex = file.lastIndexOf('.');
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
  }

  const kind = parsed.spi ? InputKind.SPI : InputKind.Generic;
  const hasMetadata = parsed['no-metadata'] ? HasMetadata.No : HasMetadata.Yes;

  files.forEach((file: string) => {
    const f = readFileSync(file);
    const name = kind === InputKind.Generic ? 'generic PVM' : 'JAM SPI';
    console.log(`🤖 Assembly of ${file} (as ${name})`);
    console.log(disassemble(Array.from(f), kind, hasMetadata));
  });
}

function handleRun(args: string[]) {
  const parsed = minimist(args, {
    boolean: ['spi', 'no-logs', 'no-metadata', 'help'],
    alias: { h: 'help' }
  });

  if (parsed.help) {
    console.log(HELP_TEXT);
    return;
  }

  const files = parsed._;
  if (files.length === 0) {
    console.error("Error: No files provided for run command.");
    console.error("Usage: anan-as run [--spi] [--no-logs] [--no-metadata] <file1.jam> [file2...]");
    process.exit(1);
  }

  // Validate file extensions for run command
  for (const file of files) {
    const ext = file.substring(file.lastIndexOf('.'));
    if (ext !== '.jam') {
      console.error(`Error: Invalid file extension '${ext}' for run command.`);
      console.error("Only .jam files are supported for the run command.");
      process.exit(1);
    }
  }

  const kind = parsed.spi ? InputKind.SPI : InputKind.Generic;
  const logs = !parsed['no-logs'];
  const hasMetadata = parsed['no-metadata'] ? HasMetadata.No : HasMetadata.Yes;

  files.forEach((file: string) => {
    const f = readFileSync(file);
    const name = kind === InputKind.Generic ? 'generic PVM' : 'JAM SPI';
    console.log(`🚀 Running ${file} (as ${name})`);

    try {
      const program = prepareProgram(kind, hasMetadata, Array.from(f), [], [], [], []);
      const result = runProgram(program, BigInt(0), 0, logs, false);

      console.log(`Status: ${result.status}`);
      console.log(`Exit code: ${result.exitCode}`);
      console.log(`Program counter: ${result.pc}`);
      console.log(`Gas remaining: ${result.gas}`);
      console.log(`Registers: [${result.registers.join(', ')}]`);
    } catch (error) {
      console.error(`Error running ${file}:`, error);
    }
  });
}
