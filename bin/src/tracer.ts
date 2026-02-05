import { hexEncode } from "./utils.js";

export interface Tracer {
  start(pc: number, gas: bigint, registers: bigint[] | Map<number, bigint>): void;
  spiArgs(address: number, data: number[]): void;
  ecalli(index: number, pc: number, gas: bigint, registers: bigint[]): void;
  memread(address: number | bigint, data: Uint8Array): void;
  memwrite(address: number | bigint, data: Uint8Array): void;
  setreg(index: number, value: bigint): void;
  setgas(gas: bigint): void;
  termination(type: string, exitCode: number, pc: number, gas: bigint, registers: bigint[]): void;
}

export class ConsoleTracer implements Tracer {
  start(pc: number, gas: bigint, registers: bigint[] | Map<number, bigint>): void {
    console.log(`start pc=${pc} gas=${gas} ${formatRegisters(registers)}`);
  }

  spiArgs(address: number, data: number[]): void {
    console.log(`  memwrite ${address} len=${data.length} <- ${hexEncode(data)}`);
  }

  ecalli(index: number, pc: number, gas: bigint, registers: bigint[]): void {
    console.log(`\necalli=${index} pc=${pc} gas=${gas} ${formatRegisters(registers)}`);
  }

  memread(address: number | bigint, data: Uint8Array): void {
    console.log(`  memread 0x${address.toString(16)} len=${data.length} -> ${formatHex(data)}`);
  }

  memwrite(address: number | bigint, data: Uint8Array): void {
    console.log(`  memwrite 0x${address.toString(16)} len=${data.length} <- ${formatHex(data)}`);
  }

  setreg(index: number, value: bigint): void {
    console.log(`  setreg r${index.toString().padStart(2, "0")} <- 0x${value.toString(16)}`);
  }

  setgas(gas: bigint): void {
    console.log(`  setgas <- ${gas}`);
  }

  termination(type: string, exitCode: number, pc: number, gas: bigint, registers: bigint[]): void {
    let termLine = `\n------\n${type}`;
    if (type === "PANIC" && exitCode !== 0) {
      termLine += `=${exitCode}`;
    }
    termLine += ` pc=${pc} gas=${gas} ${formatRegisters(registers)}`;
    console.log(termLine);
  }
}

export class NoOpTracer implements Tracer {
  start(): void {}
  spiArgs(): void {}
  ecalli(): void {}
  memread(): void {}
  memwrite(): void {}
  setreg(): void {}
  setgas(): void {}
  termination(): void {}
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
