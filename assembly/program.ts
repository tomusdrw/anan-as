import { Args, Arguments, DECODERS, REQUIRED_BYTES } from "./arguments";
import { Decoder } from "./codec";
import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";
import { reg, u32SignExtend } from "./instructions/utils";
import { Registers } from "./registers";

export type ProgramCounter = u32;

const MAX_SKIP: u32 = 24;

export function decodeSpi(data: Uint8Array): Program {
  const decoder = new Decoder(data);

  const roLength = decoder.u24();
  const rwLength = decoder.u24();
  const _heapPages = decoder.u16();
  const _stackSize = decoder.u24();

  const _roMem = decoder.bytes(roLength);
  const _rwMem = decoder.bytes(rwLength);

  const codeLength = decoder.u32();
  const code = decoder.bytes(codeLength);
  decoder.finish();

  return deblob(code);
}

export function liftBytes(data: u8[]): Uint8Array {
  const p = new Uint8Array(data.length);
  p.set(data, 0);
  return p;
}

export function lowerBytes(data: Uint8Array): u8[] {
  const r = new Array<u8>(data.length);
  for (let i = 0; i < data.length; i++) {
    r[i] = data[i];
  }
  return r;
}

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

export class Mask {
  // NOTE: might be longer than code (bit-alignment)
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
          this.bytesToSkip[index + b] = lastInstructionOffset < MAX_SKIP ? lastInstructionOffset : MAX_SKIP;
        }
      }
    }
  }

  isInstruction(index: ProgramCounter): boolean {
    if (index >= <u32>this.bytesToSkip.length) {
      return false;
    }

    return this.bytesToSkip[index] === 0;
  }

  /**
   * Given we are at instruction `i`, how many bytes should be skipped.
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

export class BasicBlocks {
  readonly isStartOrEnd: StaticArray<BasicBlock>;

  constructor(code: Uint8Array, mask: Mask) {
    const len = code.length;
    const isStartOrEnd = new StaticArray<BasicBlock>(len);
    isStartOrEnd[0] = BasicBlock.START;
    for (let n: i32 = 0; n < len; n += 1) {
      const isInstructionInMask = mask.isInstruction(n);
      const skipArgs = mask.skipBytesToNextInstruction(n);
      const iData = code[n] >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[code[n]];
      const isTerminating = iData.isTerminating;

      if (isInstructionInMask && isTerminating)  {
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
  readonly jumps: StaticArray<ProgramCounter>;

  constructor(itemBytes: u8, data: Uint8Array) {
    const jumps = new StaticArray<ProgramCounter>(itemBytes > 0 ? data.length / itemBytes : 0);

    for (let i = 0; i < data.length; i += itemBytes) {
      let num = 0;
      for (let j: i32 = itemBytes - 1; j >= 0; j--) {
        num = num << 8;
        num += data[i + j];
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
