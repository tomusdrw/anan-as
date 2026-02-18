import { buildMemory } from "./api-internal";
import { InitialChunk, InitialPage } from "./api-types";
import { Decoder } from "./codec";
import { Gas } from "./gas";
import { Interpreter, Status } from "./interpreter";
import { MaybePageFault, MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE } from "./memory-page";
import { deblob, extractCodeAndMetadata, liftBytes } from "./program";
import { NO_OF_REGISTERS, REG_SIZE_BYTES, Registers } from "./registers";
import { decodeSpi } from "./spi";

let interpreter: Interpreter | null = null;

export function resetJAM(program: u8[], pc: u32, initialGas: Gas, args: u8[], hasMetadata: boolean = false): void {
  const code = hasMetadata ? extractCodeAndMetadata(liftBytes(program)).code : liftBytes(program);

  const p = decodeSpi(code, liftBytes(args), 128);
  const int = new Interpreter(p.program, p.registers, p.memory);
  int.nextPc = <u32>pc;
  int.gas.set(initialGas);

  if (interpreter !== null) {
    (<Interpreter>interpreter).memory.free();
  }

  interpreter = int;
}

export function resetGeneric(program: u8[], flatRegisters: u8[], initialGas: Gas, hasMetadata: boolean = false): void {
  const code = hasMetadata ? extractCodeAndMetadata(liftBytes(program)).code : liftBytes(program);

  const p = deblob(code);
  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  fillRegisters(registers, flatRegisters);
  const int = new Interpreter(p, registers);
  int.gas.set(initialGas);

  if (interpreter !== null) {
    (<Interpreter>interpreter).memory.free();
  }

  interpreter = int;
}

export function resetGenericWithMemory(
  program: u8[],
  flatRegisters: u8[],
  pageMap: Uint8Array,
  chunks: Uint8Array,
  initialGas: Gas,
  hasMetadata: boolean = false,
): void {
  const code = hasMetadata ? extractCodeAndMetadata(liftBytes(program)).code : liftBytes(program);

  const p = deblob(code);
  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  fillRegisters(registers, flatRegisters);

  const builder = new MemoryBuilder();
  const memory = buildMemory(builder, readPages(pageMap), readChunks(chunks));

  const int = new Interpreter(p, registers, memory);
  int.gas.set(initialGas);

  interpreter = int;
}

export function nextStep(): boolean {
  if (interpreter !== null) {
    const int = <Interpreter>interpreter;
    return int.nextSteps();
  }
  return false;
}

export function nSteps(steps: u32): boolean {
  if (interpreter !== null) {
    const int = <Interpreter>interpreter;
    return int.nextSteps(steps);
  }
  return false;
}

export function getProgramCounter(): u32 {
  if (interpreter === null) {
    return 0;
  }
  const int = <Interpreter>interpreter;
  return u32(int.pc);
}

export function setNextProgramCounter(pc: u32): void {
  if (interpreter === null) {
    return;
  }
  const int = <Interpreter>interpreter;
  int.nextPc = pc;
}

export function getStatus(): u8 {
  if (interpreter === null) {
    return <u8>Status.PANIC;
  }
  const int = <Interpreter>interpreter;
  return <u8>int.status;
}

export function getExitArg(): u32 {
  if (interpreter === null) {
    return 0;
  }
  const int = <Interpreter>interpreter;
  return int.exitCode || 0;
}

export function getGasLeft(): i64 {
  if (interpreter === null) {
    return 0;
  }
  const int = <Interpreter>interpreter;
  return int.gas.get();
}

export function setGasLeft(gas: i64): void {
  if (interpreter !== null) {
    const int = <Interpreter>interpreter;
    int.gas.set(gas);
  }
}

export function getRegisters(): Uint8Array {
  const flat = new Uint8Array(NO_OF_REGISTERS * REG_SIZE_BYTES).fill(0);
  if (interpreter === null) {
    return flat;
  }

  const int = <Interpreter>interpreter;
  for (let i = 0; i < int.registers.length; i++) {
    let val = int.registers[i];
    for (let j = 0; j < REG_SIZE_BYTES; j++) {
      const index = i * REG_SIZE_BYTES + j;
      flat[index] = <u8>(val & 0xff);
      val = val >> 8;
    }
  }

  return flat;
}

export function setRegisters(flatRegisters: u8[]): void {
  if (interpreter === null) {
    return;
  }
  const int = <Interpreter>interpreter;
  fillRegisters(int.registers, flatRegisters);
}

export function getPageDump(index: u32): Uint8Array {
  if (interpreter === null) {
    return new Uint8Array(PAGE_SIZE).fill(0);
  }
  const int = <Interpreter>interpreter;
  const page = int.memory.pageDump(index);
  if (page === null) {
    return new Uint8Array(PAGE_SIZE).fill(0);
  }

  return page;
}

/**
 * Read a chunk of memory at `[address, address + length)`.
 *
 * Returns the requested memory chunk or `null` if reading triggered a page fault.
 *
 * @deprecated Getting memory like that is extremely inefficient (copying mulitple times)
 * and error prone (we may not be able to allocate).
 * Instead WASM should be able to return memory pointers for already allocated pages.
 * So reading memory on the caller side should be something like this:
 * ```ts
 * let pagesRead = 0;
 * for (let address = start; address < end; address += PAGE_SIZE) {
 *   const page = address >> PAGE_SIZE_SHIFT;
 *   const maybePointer = getPagePointer(page);
 *   // check page fault
 *   if (maybePointer === null) {
 *     throw new Error(`Page fault at ${page << PAGE_SIZE_SHIFT}`);
 *   }
 *   // otherwise copy to JS
 *   destination.set(
 *     pagesRead << PAGE_SIZE_SHIFT,
 *     new Uint8Array(wasm.instance.memory, maybePointer, Math.min(end, PAGE_SIZE))
 *   );
 *   pagesRead += 1;
 * }
 * ```
 *
 * goals:
 * 1. No additional allocations on the WASM side
 * 2. Copying directly from wasm memory on the JS side
 *
 */
export function getMemory(address: u32, length: u32): Uint8Array | null {
  if (interpreter === null) {
    return null;
  }
  const int = <Interpreter>interpreter;
  const faultRes = new MaybePageFault();
  const result = int.memory.getMemory(faultRes, address, length);
  if (faultRes.isFault) {
    return null;
  }
  return result;
}

/**
 * Write given `data` under memory indices `[address, address + data.length)`.
 *
 * Returns `true` if the write was successful and `false` if page fault has been triggered.
 */
export function setMemory(address: u32, data: Uint8Array): boolean {
  if (interpreter === null) {
    return false;
  }
  const int = <Interpreter>interpreter;
  const end = address + data.length;
  const faultRes = new MaybePageFault();
  for (let i = address; i < end; i++) {
    int.memory.setU8(faultRes, i, data[i - address]);
    if (faultRes.isFault) {
      return false;
    }
  }
  return true;
}

function fillRegisters(registers: Registers, flat: u8[]): void {
  const len = registers.length * REG_SIZE_BYTES;
  if (len !== flat.length) {
    throw new Error(`Mismatching  registers size, got: ${flat.length}, expected: ${len}`);
  }

  for (let i = 0; i < registers.length; i++) {
    let num: u64 = 0;
    for (let j: u8 = 0; j < <u8>REG_SIZE_BYTES; j++) {
      const index = i * REG_SIZE_BYTES + j;
      num |= (<u64>flat[index]) << (j * 8);
    }
    registers[i] = num;
  }
}

function readPages(pageMap: Uint8Array): InitialPage[] {
  const pages: InitialPage[] = [];
  const codec = new Decoder(pageMap);
  while (!codec.isExhausted()) {
    const p = new InitialPage();
    p.address = codec.u32();
    p.length = codec.u32();
    p.access = codec.u8() > 0 ? Access.Write : Access.Read;
    pages.push(p);
  }
  return pages;
}

function readChunks(chunks: Uint8Array): InitialChunk[] {
  const res: InitialChunk[] = [];
  const codec = new Decoder(chunks);
  while (!codec.isExhausted()) {
    const c = new InitialChunk();
    c.address = codec.u32();
    const len = codec.u32();
    const data = codec.bytes(len);
    for (let i: u32 = 0; i < len; i++) {
      c.data.push(data[i]);
    }
    res.push(c);
  }
  return res;
}
