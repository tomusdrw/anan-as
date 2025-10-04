import { Decoder } from "./codec";
import { Memory, MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE, PAGE_SIZE_SHIFT, SEGMENT_SIZE, SEGMENT_SIZE_SHIFT } from "./memory-page";
import { Program, deblob } from "./program";
import { NO_OF_REGISTERS, Registers } from "./registers";

/** `Z_I`: https://graypaper.fluffylabs.dev/#/ab2cdbd/2daf002daf00?v=0.7.2 */
export const MAX_ARGS_LEN: u32 = 2 ** 24;
/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2d47022d4702?v=0.7.2 */
export const ARGS_SEGMENT_START: u32 = 2 ** 32 - SEGMENT_SIZE - MAX_ARGS_LEN;
/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2d33022d3502?v=0.7.2 */
export const STACK_SEGMENT_END: u32 = ARGS_SEGMENT_START - SEGMENT_SIZE;

/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2da3002da300?v=0.7.2 */
export function decodeSpi(data: Uint8Array, args: Uint8Array): StandardProgram {
  const argsLength = <u32>args.length;
  if (argsLength > MAX_ARGS_LEN) {
    throw new Error(`Arguments length is too big. Got: ${argsLength}, max: ${MAX_ARGS_LEN}`);
  }

  const decoder = new Decoder(data);

  const roLength = decoder.u24();
  const rwLength = decoder.u24();
  const heapPages = decoder.u16();
  const stackSize = decoder.u24();

  const roMem = decoder.bytes(roLength);
  const rwMem = decoder.bytes(rwLength);

  const codeLength = decoder.u32();
  const code = decoder.bytes(codeLength);
  decoder.finish();

  const program = deblob(code);

  // building memory
  const builder = new MemoryBuilder();

  const heapStart = 2 * SEGMENT_SIZE + alignToSegmentSize(roLength);
  const heapZerosStart = heapStart + alignToPageSize(rwLength);
  const heapZerosLength = heapPages * PAGE_SIZE;
  const heapZerosEnd = heapZerosStart + heapZerosLength;

  const stackLength = alignToPageSize(stackSize);
  // stackLength is bounded to `2**24`, so there is no risk of underflow here.
  const stackStart = STACK_SEGMENT_END - stackLength;

  // readable memory
  if (roLength > 0) {
    builder.setData(Access.Read, SEGMENT_SIZE, roMem);
  }
  if (argsLength > 0) {
    builder.setData(Access.Read, ARGS_SEGMENT_START, args);
  }

  // writable memory
  if (rwLength > 0) {
    builder.setData(Access.Write, heapStart, rwMem);
  }
  if (heapZerosLength > 0) {
    builder.setEmpty(Access.Write, heapZerosStart, heapZerosLength);
  }
  if (stackLength > 0) {
    builder.setEmpty(Access.Write, stackStart, stackLength);
  }

  const memory = builder.build(heapZerosEnd);

  // build registers
  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  registers[0] = <u64>0xffff_0000;
  registers[1] = <u64>STACK_SEGMENT_END;
  registers[7] = <u64>ARGS_SEGMENT_START;
  registers[8] = <u64>argsLength;

  return new StandardProgram(program, memory, registers);
}

function alignToPageSize(size: u32): u32 {
  return ((size + PAGE_SIZE - 1) >> PAGE_SIZE_SHIFT) << PAGE_SIZE_SHIFT;
}

function alignToSegmentSize(size: u32): u32 {
  return ((size + SEGMENT_SIZE - 1) >> SEGMENT_SIZE_SHIFT) << SEGMENT_SIZE_SHIFT;
}

/**
 * SPI Program with memory and registers.
 *
 * https://graypaper.fluffylabs.dev/#/ab2cdbd/2d13002d1400?v=0.7.2
 */
export class StandardProgram {
  metadata: Uint8Array = new Uint8Array(0);
  pc: u32 = 0;
  gas: i64 = 0;

  constructor(
    public readonly program: Program,
    public readonly memory: Memory,
    public readonly registers: Registers,
  ) {}

  toString(): string {
    return `StandardProgram { program: ${this.program}, memory_pages: ${this.memory.pages.size}, registers: ${this.registers} }`;
  }
}
