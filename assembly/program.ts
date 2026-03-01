import { Args, Arguments, DECODERS, REQUIRED_BYTES } from "./arguments";
import { Decoder } from "./codec";
import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";
import { reg, u32SignExtend } from "./instructions/utils";
import { portable } from "./portable";
import { Registers } from "./registers";

export type ProgramCounter = u32;
export type Code = StaticArray<u8>;

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

/** Convert `u8` to `Uint8Array` */
export function liftBytes(data: u8[]): Uint8Array {
  const p = new Uint8Array(data.length);
  p.set(data, 0);
  return p;
}

/**  Convert `Uint8Array` to `Code` (StaticArray<u8>) */
export function lowerBytes(data: Uint8Array): Code {
  const r = new StaticArray<u8>(data.length);
  for (let i = 0; i < data.length; i++) {
    r[i] = data[i];
  }
  return r;
}

/** https://graypaper.fluffylabs.dev/#/cc517d7/234f01234f01?v=0.6.5 */
export function deblob(program: Uint8Array, useBlockGas: boolean): Program {
  const decoder = new Decoder(program);

  // number of items in the jump table
  const jumpTableLength = decoder.varU32();

  // how many bytes are used to encode a single item of the jump table
  const jumpTableItemLength = decoder.u8();
  // the length of the code (in bytes).
  const codeLength = decoder.varU32();

  const jumpTableLengthInBytes = i32(jumpTableLength * jumpTableItemLength);
  const rawJumpTable = decoder.bytes(jumpTableLengthInBytes);

  // NOTE [ToDr] we copy the code here, because indexing a raw
  // assembly script array is faster than going through `Uint8Array` API.
  const rawCode = lowerBytes(decoder.bytes(codeLength));
  const rawMask = decoder.bytes(i32((codeLength + 7) / 8));

  const mask = new Mask(rawMask, codeLength);
  const jumpTable = new JumpTable(jumpTableItemLength, rawJumpTable);
  const basicBlocks = new BasicBlocks(rawCode, mask);
  const gasCosts = new GasCosts(rawCode, mask, basicBlocks, useBlockGas);

  return new Program(rawCode, mask, jumpTable, basicBlocks, gasCosts);
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
    if (index >= u32(this.bytesToSkip.length)) {
      return false;
    }

    return portable.staticArrayAt(this.bytesToSkip, u32(index)) === 0;
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
      return portable.staticArrayAt(this.bytesToSkip, i + 1);
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

export class GasCosts {
  // Since code is just u8, we use the other 24 bytes to store the gas cost.
  readonly codeAndGas: StaticArray<u32>;

  constructor(code: Code, mask: Mask, blocks: BasicBlocks, useBlockGasCost: boolean) {
    const len = code.length;
    const costs = new StaticArray<u32>(len);
    for (let n: i32 = 0; n < len; n += 1) {
      const isInstructionInMask = mask.isInstruction(n);
      if (!isInstructionInMask) {
        costs[n] = code[n];
        continue;
      }

      const skipArgs = mask.skipBytesToNextInstruction(n);
      const iData = code[n] >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[code[n]];
      costs[n] = code[n] | (iData.gas << 8);
      n += skipArgs;
    }

    // sum up costs per block
    if (useBlockGasCost) {
      let previousStart: u32 = 0;
      let previousSum: u32 = 0;
      for (let n: i32 = 0; n < len; n += 1) {
        const currentGas = costs[n] >> 8;
        costs[n] = code[n]; // reset to just opcode (gas=0)
        if (blocks.isStart(n)) {
          costs[previousStart] = code[previousStart] | (previousSum << 8);
          previousSum = currentGas;
          previousStart = n;
        } else {
          previousSum += currentGas;
        }

        n += mask.skipBytesToNextInstruction(n);
      }
      // final assignment
      costs[previousStart] = code[previousStart] | (previousSum << 8);
    }

    this.codeAndGas = costs;
  }

  toString(): string {
    let v = "GasCosts[";
    for (let i = 0; i < this.codeAndGas.length; i += 1) {
      const gas = this.codeAndGas[i] >> 8;
      if (gas !== 0) {
        v += `${i} -> ${gas}, `;
      }
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

  constructor(code: Code, mask: Mask) {
    const len = code.length;
    const isStartOrEnd = new StaticArray<BasicBlock>(len);
    if (len > 0) {
      isStartOrEnd[0] = BasicBlock.START;
    }
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
      return (portable.staticArrayAt(this.isStartOrEnd, newPc) & BasicBlock.START) > 0;
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
    const jumps = new StaticArray<u64>(itemBytes > 0 ? i32(data.length / itemBytes) : 0);

    for (let i = 0; i < data.length; i += itemBytes) {
      let num: u64 = u64(0);
      for (let j: i32 = itemBytes - 1; j >= 0; j--) {
        let nextNum: u64 = num << u64(8);
        let isOverflow = nextNum < num;
        nextNum = portable.u64_add(nextNum, u64(data[i + j]));
        isOverflow = isOverflow || nextNum < num;
        // handle overflow
        num = isOverflow ? u64.MAX_VALUE : nextNum;
      }
      jumps[i32(i / itemBytes)] = num;
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
    public readonly code: Code,
    public readonly mask: Mask,
    public readonly jumpTable: JumpTable,
    public readonly basicBlocks: BasicBlocks,
    public readonly gasCosts: GasCosts,
  ) {}

  toString(): string {
    return `Program { code: ${this.code}, mask: ${this.mask}, jumpTable: ${this.jumpTable}, basicBlocks: ${this.basicBlocks}, gasCosts: ${this.gasCosts} }`;
  }
}

// Pre-allocated buffer for the rare case when code is shorter than needed.
// Max REQUIRED_BYTES is 9 (OneRegOneExtImm). We allocate 16 for safety.
const EXTENDED_BUF: Code = new StaticArray<u8>(16);

export function decodeArguments(args: Args, kind: Arguments, code: Code, offset: i32, lim: u32): Args {
  if (code.length < offset + REQUIRED_BYTES[kind]) {
    // in case we have less data than needed we extend the data with zeros.
    const reqBytes = unchecked(REQUIRED_BYTES[kind]);
    for (let i = 0; i < reqBytes; i++) {
      EXTENDED_BUF[i] = 0;
    }
    for (let i = offset; i < code.length; i++) {
      EXTENDED_BUF[i - offset] = unchecked(code[i]);
    }
    return unchecked(DECODERS[kind])(args, EXTENDED_BUF, 0, lim);
  }
  return unchecked(DECODERS[kind])(args, code, offset, offset + lim);
}

class ResolvedArguments {
  a: i64 = i64(0);
  b: i64 = i64(0);
  c: i64 = i64(0);
  d: i64 = i64(0);
  decoded: Args = new Args();
}

export function resolveArguments(
  argsRes: Args,
  kind: Arguments,
  code: Code,
  offset: u32,
  lim: u32,
  registers: Registers,
): ResolvedArguments | null {
  const args = decodeArguments(argsRes, kind, code, offset, lim);
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
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = u32SignExtend(args.b);
      return resolved;
    case Arguments.OneRegOneExtImm:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = portable.u64_add(u64(args.a) << u64(32), u64(args.b));
      return resolved;
    case Arguments.OneRegTwoImm:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = u32SignExtend(args.b);
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.OneRegOneImmOneOff:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = u32SignExtend(args.b);
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.TwoReg:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      return resolved;
    case Arguments.TwoRegOneImm:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.TwoRegOneOff:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.TwoRegTwoImm:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      resolved.c = u32SignExtend(args.c);
      resolved.d = u32SignExtend(args.d);
      return resolved;
    case Arguments.ThreeReg:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      resolved.c = registers[reg(u64(args.c))];
      return resolved;
    default:
      throw new Error(`Unhandled arguments kind: ${kind}`);
  }
}
