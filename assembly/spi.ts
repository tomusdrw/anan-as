import { Decoder } from "./codec";
import { Memory, MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE, SEGMENT_SIZE } from "./memory-page";
import { Program, deblob } from "./program";
import { NO_OF_REGISTERS, Registers } from "./registers";

/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2daf002daf00?v=0.7.2 */
export const DATA_LENGTH: u32 = 2 ** 24;
/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2d47022d4702?v=0.7.2 */
export const ARGS_SEGMENT_START: u32 = 2 ** 32 - SEGMENT_SIZE - DATA_LENGTH;
/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2d33022d3502?v=0.7.2 */
export const STACK_SEGMENT_END: u32 = 2 ** 32 - 2 * SEGMENT_SIZE - DATA_LENGTH;

/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2da3002da300?v=0.7.2 */
export function decodeSpi(data: Uint8Array, args: Uint8Array): StandardProgram {
  const argsLength = <u32>args.length;
  if (argsLength > DATA_LENGTH) {
    throw new Error("Arguments length too big");
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
  const heapEnd = heapStart + alignToPageSize(rwLength);
  const heapZerosLength = heapPages * PAGE_SIZE;
  const heapZerosEnd = heapEnd + heapZerosLength;

  const stackLength = alignToPageSize(stackSize);
  const stackStart = STACK_SEGMENT_END - stackLength;
  const stackEnd = STACK_SEGMENT_END;

  const argsEnd = ARGS_SEGMENT_START + alignToPageSize(argsLength);
  const argsZerosLength = alignToPageSize(argsLength);
  const argsZerosEnd = argsEnd + argsZerosLength;

  // readable memory
  if (roLength > 0) {
    builder.setData(Access.Read, SEGMENT_SIZE, roMem);
  }
  if (argsLength > 0) {
    builder.setData(Access.Read, ARGS_SEGMENT_START, args);
  }
  if (argsEnd < argsZerosEnd) {
    builder.setData(Access.Read, argsEnd, new Uint8Array(argsZerosLength));
  }

  // writable memory
  if (rwLength > 0) {
    builder.setData(Access.Write, heapStart, rwMem);
  }
  if (heapEnd < heapZerosEnd) {
    builder.setData(Access.Write, heapEnd, new Uint8Array(heapZerosLength));
  }
  if (stackStart < stackEnd) {
    builder.setData(Access.Write, stackStart, new Uint8Array(stackLength));
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

function alignToPageSize(size: number): u32 {
  return PAGE_SIZE * <u32>Math.ceil(size / PAGE_SIZE);
}

function alignToSegmentSize(size: number): u32 {
  return SEGMENT_SIZE * <u32>Math.ceil(size / SEGMENT_SIZE);
}

/**
 * SPI Program with memory and registers.
 *
 * https://graypaper.fluffylabs.dev/#/ab2cdbd/2d13002d1400?v=0.7.2
 */
export class StandardProgram extends Program {
  constructor(
    program: Program,
    public readonly memory: Memory,
    public readonly registers: Registers,
  ) {
    super(program.code, program.mask, program.jumpTable, program.basicBlocks);
  }

  toString(): string {
    return `StandardProgram { code: ${this.code}, mask: ${this.mask}, jumpTable: ${this.jumpTable}, basicBlocks: ${this.basicBlocks} , memory_pages: ${this.memory.pages.size}, registers: ${this.registers} }`;
  }
}
