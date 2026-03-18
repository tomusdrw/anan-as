#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  disassemble,
  HasMetadata,
  InputKind,
  prepareProgram,
  pvmDestroy,
  pvmReadMemory,
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
  anan-as run [--spi] [--no-logs] [--no-metadata] [--no-log-host-call] [--pc <number>] [--gas <number>] [--regs <r0,r1,...,r12>] <file.jam> [spi-args.bin or hex]
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
  --regs <values>     Set initial registers (comma-separated, 13 values: r0,r1,...,r12; supports decimal and 0x hex)
  --pages <specs>     Add writable memory pages (semicolon-separated: "addr:size;addr:size"; addr/size in hex or decimal)
  --mem <specs>       Initialize memory (semicolon-separated: "addr:hex_bytes;addr:hex_bytes")
  --dump <specs>      Dump memory after execution (semicolon-separated: "addr:len;addr:len")
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
      regs: { type: "string" },
      pages: { type: "string" },
      mem: { type: "string" },
      dump: { type: "string" },
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
  const initialRegisters = parseRegs(values.regs);
  const initialPages = parsePages(values.pages);
  const initialMemory = parseMem(values.mem);
  const dumpRegions = parseDump(values.dump);

  const programCode = Array.from(readFileSync(programFile));
  const name = kind === InputKind.Generic ? "generic PVM" : "JAM SPI";
  console.log(`🚀 Running ${programFile} (as ${name})`);

  try {
    const preallocateMemoryPages = 128;
    const useBlockGas = true;
    const program = prepareProgram(
      kind,
      hasMetadata,
      programCode,
      initialRegisters,
      initialPages,
      initialMemory,
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

    // Dump memory regions before destroying the VM
    for (const region of dumpRegions) {
      const data = pvmReadMemory(id, region.address, region.length);
      const addrHex = `0x${region.address.toString(16)}`;
      if (data) {
        console.log(`\nMemory @ ${addrHex} (${region.length} bytes):`);
        for (let off = 0; off < data.length; off += 16) {
          const addr = region.address + off;
          const slice = Array.from(data.slice(off, Math.min(off + 16, data.length)));
          const hex = slice.map((b: number) => b.toString(16).padStart(2, "0")).join(" ");
          const ascii = slice.map((b: number) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
          console.log(`  ${addr.toString(16).padStart(8, "0")}:  ${hex.padEnd(47)}  ${ascii}`);
        }
      } else {
        console.log(`\nMemory @ ${addrHex}: <page fault>`);
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

function parseRegs(regsStr?: string): bigint[] {
  if (regsStr === undefined) {
    return [];
  }

  const parts = regsStr.split(",");
  if (parts.length !== 13) {
    console.error(`Error: --regs must have exactly 13 comma-separated values (got ${parts.length}).`);
    console.error("Format: --regs r0,r1,r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12");
    process.exit(1);
  }

  return parts.map((s, i) => {
    const trimmed = s.trim();
    try {
      const val = BigInt(trimmed);
      return BigInt.asUintN(64, val);
    } catch (_e) {
      console.error(`Error: --regs value at index ${i} ("${trimmed}") is not a valid integer.`);
      return process.exit(1);
    }
  });
}

function parseNum(s: string): number {
  const trimmed = s.trim();
  if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
    return parseInt(trimmed, 16);
  }
  return parseInt(trimmed, 10);
}

function parsePages(pagesStr?: string): { address: number; length: number; access: number }[] {
  if (pagesStr === undefined) {
    return [];
  }

  // Format: "addr:size;addr:size" — all pages are writable (access=2)
  // Or "addr:size:r" for read-only (access=1)
  const specs = pagesStr.split(";").filter((s) => s.trim().length > 0);
  return specs.map((spec, i) => {
    const parts = spec.split(":");
    if (parts.length < 2 || parts.length > 3) {
      console.error(`Error: --pages entry ${i} ("${spec}") must be "addr:size" or "addr:size:r".`);
      process.exit(1);
    }

    const address = parseNum(parts[0]);
    const length = parseNum(parts[1]);
    const access = parts[2]?.trim() === "r" ? 1 : 2; // 1=Read, 2=Write

    if (Number.isNaN(address) || Number.isNaN(length) || length <= 0) {
      console.error(`Error: --pages entry ${i} ("${spec}") has invalid address or size.`);
      process.exit(1);
    }

    return { address, length, access };
  });
}

function parseMem(memStr?: string): { address: number; data: number[] }[] {
  if (memStr === undefined) {
    return [];
  }

  // Format: "addr:hexbytes;addr:hexbytes"
  // Example: "0x20000:0500000000000000;0x20008:0300000000000000"
  const specs = memStr.split(";").filter((s) => s.trim().length > 0);
  return specs.map((spec, i) => {
    const colonIdx = spec.indexOf(":");
    if (colonIdx === -1) {
      console.error(`Error: --mem entry ${i} ("${spec}") must be "addr:hexbytes".`);
      process.exit(1);
    }

    const addrStr = spec.substring(0, colonIdx).trim();
    let hexStr = spec.substring(colonIdx + 1).trim();

    const address = parseNum(addrStr);
    if (Number.isNaN(address)) {
      console.error(`Error: --mem entry ${i} has invalid address "${addrStr}".`);
      process.exit(1);
    }

    // Strip 0x prefix from hex data
    if (hexStr.startsWith("0x") || hexStr.startsWith("0X")) {
      hexStr = hexStr.substring(2);
    }

    if (hexStr.length % 2 !== 0) {
      console.error(`Error: --mem entry ${i} hex data has odd length.`);
      process.exit(1);
    }

    const data: number[] = [];
    for (let j = 0; j < hexStr.length; j += 2) {
      data.push(parseInt(hexStr.substring(j, j + 2), 16));
    }

    return { address, data };
  });
}

function parseDump(dumpStr?: string): { address: number; length: number }[] {
  if (dumpStr === undefined) {
    return [];
  }

  // Format: "addr:len;addr:len"
  // Example: "0x20000:64;0x20100:32"
  const specs = dumpStr.split(";").filter((s) => s.trim().length > 0);
  return specs.map((spec, i) => {
    const parts = spec.split(":");
    if (parts.length !== 2) {
      console.error(`Error: --dump entry ${i} ("${spec}") must be "addr:len".`);
      process.exit(1);
    }

    const address = parseNum(parts[0]);
    const length = parseNum(parts[1]);

    if (Number.isNaN(address) || Number.isNaN(length) || length <= 0) {
      console.error(`Error: --dump entry ${i} ("${spec}") has invalid address or length.`);
      process.exit(1);
    }

    return { address, length };
  });
}
