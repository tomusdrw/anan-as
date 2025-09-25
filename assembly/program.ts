import { Args, Arguments, DECODERS, REQUIRED_BYTES } from "./arguments";
import { Decoder } from "./codec";
import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";
import { reg, u32SignExtend } from "./instructions/utils";
import { Memory, MemoryBuilder } from "./memory";
import { ARGS_SEGMENT_START, Access, PAGE_SIZE, RESERVED_MEMORY, STACK_SEGMENT_END } from "./memory-page";
import { NO_OF_REGISTERS, Registers } from "./registers";

export type ProgramCounter = u32;

const MAX_SKIP: u32 = 24;

export class CodeAndMetadata {
  constructor(
    readonly code: Uint8Array,
    readonly metadata: Uint8Array,
  ) {}
}

/** https://graypaper.fluffylabs.dev/#/cc517d7/109a01109a01?v=0.6.5 */
export function extractCodeAndMetadata(data: Uint8Array): CodeAndMetadata {
  const decoder = new Decoder(data);
  const metadataLength = decoder.varU32();
  const metadata = decoder.bytes(metadataLength);
  const code = decoder.remainingBytes();
  return new CodeAndMetadata(code, metadata);
}

/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2da3002da300?v=0.7.2 */
export function decodeSpi(data: Uint8Array, args: Uint8Array): StandardProgram {
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

  const argsLength = args.length;

  const program = deblob(code);

  // building memory
  const builder = new MemoryBuilder();

  const heapStart = 2 * RESERVED_MEMORY + alignToSegmentSize(roLength);
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
    builder.setData(Access.Read, RESERVED_MEMORY, roMem);
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
  return ((size + PAGE_SIZE - 1) >> PAGE_SIZE_SHIFT) << PAGE_SIZE
}

function alignToSegmentSize(size: number): u32 {
  return ((size + SEGMENT_SIZE - 1) >> SEGMENT_SIZE_SHIFT) << SEGMENT_SIZE_SHIFT;
}

/** Convert `u8` to `Uint8Array` */
export function liftBytes(data: u8[]): Uint8Array {
  const p = new Uint8Array(data.length);
  p.set(data, 0);
  return p;
}

/**  Convert `Uint8Array` to `u8` */
export function lowerBytes(data: Uint8Array): u8[] {
  const r = new Array<u8>(data.length);
  for (let i = 0; i < data.length; i++) {
    r[i] = data[i];
  }
  return r;
}

/** https://graypaper.fluffylabs.dev/#/cc517d7/234f01234f01?v=0.6.5 */
export function deblob(program: Uint8Array): Program {
  const decoder = new Decoder(program);

  // number of items in the jump table
  const jumpTableLength = decoder.varU32();

  // how many bytes are used to encode a single item of the jump table
  const jumpTableItemLength = decoder.u8();
  // the length of the code (in bytes).
  const codeLength = decoder.varU32();

  const jumpTableLengthInBytes = jumpTableLength * jumpTableItemLength;
  const rawJumpTable = decoder.bytes(jumpTableLengthInBytes);

  const rawCode = decoder.bytes(codeLength);
  const rawMask = decoder.bytes((codeLength + 7) / 8);

  const mask = new Mask(rawMask, codeLength);
  const jumpTable = new JumpTable(jumpTableItemLength, rawJumpTable);
  const basicBlocks = new BasicBlocks(rawCode, mask);

  return new Program(rawCode, mask, jumpTable, basicBlocks);
}

/**
 * https://graypaper.fluffylabs.dev/#/cc517d7/236e01236e01?v=0.6.5
 */
export class Mask {
  /**
   * NOTE: might be longer than code (bit-alignment).
   * In this array we keep `skip(n) + 1` from the Gray Paper
   * for non-instruction bytes.
   * In case the in-code mask says there is an instruction at that location
   * we store `0` here.
   */
  readonly bytesToSkip: StaticArray<u32>;

  constructor(packedMask: Uint8Array, codeLength: i32) {
    this.bytesToSkip = new StaticArray<u32>(codeLength);
    let lastInstructionOffset: u32 = 0;
    for (let i: i32 = packedMask.length - 1; i >= 0; i -= 1) {
      let bits = packedMask[i];
      const index = i * 8;
      for (let b = 7; b >= 0; b--) {
        const isSet = bits & 0b1000_0000;
        bits = bits << 1;
        if (index + b < codeLength) {
          lastInstructionOffset = isSet ? 0 : lastInstructionOffset + 1;
          this.bytesToSkip[index + b] = lastInstructionOffset < MAX_SKIP + 1 ? lastInstructionOffset : MAX_SKIP + 1;
        }
      }
    }
  }

  isInstruction(index: ProgramCounter): boolean {
    if (index >= <u64>this.bytesToSkip.length) {
      return false;
    }

    return this.bytesToSkip[u32(index)] === 0;
  }

  /**
   * Given we are at instruction `i`, how many bytes should be skipped to
   * reach the next instruction (i.e. `skip(i) + 1` from the GP).
   *
   * NOTE: we don't guarantee that `isInstruction()` will return true
   * for the new program counter, since `skip` function is bounded by
   * an upper limit of `24` bytes.
   */
  skipBytesToNextInstruction(i: u32): u32 {
    if (i + 1 < <u32>this.bytesToSkip.length) {
      return this.bytesToSkip[i + 1];
    }

    return 0;
  }

  toString(): string {
    let v = "Mask[";
    for (let i = 0; i < this.bytesToSkip.length; i += 1) {
      v += `${this.bytesToSkip[i]}, `;
    }
    return `${v}]`;
  }
}

export enum BasicBlock {
  NONE = 0,
  START = 2,
  END = 4,
}

/**
 * https://graypaper.fluffylabs.dev/#/cc517d7/23fe0123fe01?v=0.6.5
 */
export class BasicBlocks {
  readonly isStartOrEnd: StaticArray<BasicBlock>;

  constructor(code: Uint8Array, mask: Mask) {
    const len = code.length;
    const isStartOrEnd = new StaticArray<BasicBlock>(len);
    isStartOrEnd[0] = BasicBlock.START;
    for (let n: i32 = 0; n < len; n += 1) {
      // we only track end-blocks for instructions.
      const isInstructionInMask = mask.isInstruction(n);
      if (!isInstructionInMask) {
        continue;
      }

      const skipArgs = mask.skipBytesToNextInstruction(n);
      const iData = code[n] >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[code[n]];
      const isTerminating = iData.isTerminating;

      if (isTerminating) {
        // skip is always 0?
        const newBlockStart = n + 1 + skipArgs;
        // mark the beginning of the next block
        if (newBlockStart < len) {
          isStartOrEnd[newBlockStart] = BasicBlock.START;
        }
        // and mark current instruction as terminating
        isStartOrEnd[n] |= BasicBlock.END;
      }
    }
    this.isStartOrEnd = isStartOrEnd;
  }

  isStart(newPc: u32): boolean {
    if (newPc < <u32>this.isStartOrEnd.length) {
      return (this.isStartOrEnd[newPc] & BasicBlock.START) > 0;
    }
    return false;
  }

  toString(): string {
    let v = "BasicBlocks[";
    for (let i = 0; i < this.isStartOrEnd.length; i += 1) {
      let t = "";
      const isStart = (this.isStartOrEnd[i] & BasicBlock.START) > 0;
      t += isStart ? "start" : "";
      const isEnd = (this.isStartOrEnd[i] & BasicBlock.END) > 0;
      t += isEnd ? "end" : "";
      if (t.length > 0) {
        v += `${i} -> ${t}, `;
      }
    }
    return `${v}]`;
  }
}

export class JumpTable {
  readonly jumps: StaticArray<u64>;

  constructor(itemBytes: u8, data: Uint8Array) {
    const jumps = new StaticArray<u64>(itemBytes > 0 ? data.length / itemBytes : 0);

    for (let i = 0; i < data.length; i += itemBytes) {
      let num: u64 = 0;
      for (let j: i32 = itemBytes - 1; j >= 0; j--) {
        let nextNum: u64 = num << 8;
        let isOverflow = nextNum < num;
        nextNum = nextNum + u64(data[i + j]);
        isOverflow = isOverflow || nextNum < num;
        // handle overflow
        num = isOverflow ? u64.MAX_VALUE : nextNum;
      }
      jumps[i / itemBytes] = num;
    }

    this.jumps = jumps;
  }

  toString(): string {
    let v = "JumpTable[";
    for (let i = 0; i < this.jumps.length; i += 1) {
      v += `${i} -> ${this.jumps[i]}, `;
    }
    return `${v}]`;
  }
}

export class Program {
  constructor(
    public readonly code: Uint8Array,
    public readonly mask: Mask,
    public readonly jumpTable: JumpTable,
    public readonly basicBlocks: BasicBlocks,
  ) {}

  toString(): string {
    return `Program { code: ${this.code}, mask: ${this.mask}, jumpTable: ${this.jumpTable}, basicBlocks: ${this.basicBlocks} }`;
  }
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

export function decodeArguments(kind: Arguments, data: Uint8Array, lim: u32): Args {
  if (data.length < REQUIRED_BYTES[kind]) {
    // in case we have less data than needed we extend the data with zeros.
    const extended = new Uint8Array(REQUIRED_BYTES[kind]);
    for (let i = 0; i < data.length; i++) {
      extended[i] = data[i];
    }
    return DECODERS[kind](extended, lim);
  }
  return DECODERS[kind](data, lim);
}

class ResolvedArguments {
  a: i64 = 0;
  b: i64 = 0;
  c: i64 = 0;
  d: i64 = 0;
  decoded: Args = new Args();
}

export function resolveArguments(
  kind: Arguments,
  data: Uint8Array,
  lim: u32,
  registers: Registers,
): ResolvedArguments | null {
  const args = decodeArguments(kind, data, lim);
  if (args === null) {
    return null;
  }

  const resolved = new ResolvedArguments();
  resolved.decoded = args;

  switch (kind) {
    case Arguments.Zero:
      return resolved;
    case Arguments.OneImm:
      resolved.a = u32SignExtend(args.a);
      return resolved;
    case Arguments.TwoImm:
      resolved.a = u32SignExtend(args.a);
      resolved.b = u32SignExtend(args.b);
      return resolved;
    case Arguments.OneOff:
      resolved.a = u32SignExtend(args.a);
      return resolved;
    case Arguments.OneRegOneImm:
      resolved.a = registers[reg(args.a)];
      resolved.b = u32SignExtend(args.b);
      return resolved;
    case Arguments.OneRegOneExtImm:
      resolved.a = registers[reg(args.a)];
      resolved.b = (u64(args.a) << 32) + u64(args.b);
      return resolved;
    case Arguments.OneRegTwoImm:
      resolved.a = registers[reg(args.a)];
      resolved.b = u32SignExtend(args.b);
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.OneRegOneImmOneOff:
      resolved.a = registers[reg(args.a)];
      resolved.b = u32SignExtend(args.b);
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.TwoReg:
      resolved.a = registers[reg(args.a)];
      resolved.b = registers[reg(args.b)];
      return resolved;
    case Arguments.TwoRegOneImm:
      resolved.a = registers[reg(args.a)];
      resolved.b = registers[reg(args.b)];
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.TwoRegOneOff:
      resolved.a = registers[reg(args.a)];
      resolved.b = registers[reg(args.b)];
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.TwoRegTwoImm:
      resolved.a = registers[reg(args.a)];
      resolved.b = registers[reg(args.b)];
      resolved.c = u32SignExtend(args.c);
      resolved.d = u32SignExtend(args.d);
      return resolved;
    case Arguments.ThreeReg:
      resolved.a = registers[reg(args.a)];
      resolved.b = registers[reg(args.b)];
      resolved.c = registers[reg(args.c)];
      return resolved;
    default:
      throw new Error(`Unhandled arguments kind: ${kind}`);
  }
}
