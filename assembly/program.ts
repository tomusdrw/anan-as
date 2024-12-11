import { Args, Arguments, DECODERS, REQUIRED_BYTES, encodeI32 } from "./arguments";
import { Decoder } from "./codec";
import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";

export type ProgramCounter = u32;

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

  return decodeProgram(code);
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

/** Turn given bytecode into a valid program. Add JumpTable and Mask. */
export function wrapAsProgram(bytecode: Uint8Array): Uint8Array {
  const jumpTableLength: u8 = 0;
  const jumpTableItemLength: u8 = 0;
  const codeLength = bytecode.length;
  const mask = buildMask(bytecode);
  const codeLengthBytes = encodeI32(codeLength);

  const data = new Uint8Array(1 + 1 + codeLengthBytes.length + codeLength + mask.length);
  data[0] = jumpTableLength;
  data[1] = jumpTableItemLength;
  let offset = 2;
  for (let i = 0; i < codeLengthBytes.length; i++) {
    data[offset] = codeLengthBytes[i];
    offset++;
  }
  for (let i = 0; i < bytecode.length; i++) {
    data[offset] = bytecode[i];
    offset++;
  }
  for (let i = 0; i < mask.length; i++) {
    data[offset] = mask[i];
    offset++;
  }
  return data;
}

export function decodeProgram(program: Uint8Array): Program {
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

function buildMask(bytecode: Uint8Array): u8[] {
  const mask = new StaticArray<boolean>(bytecode.length);
  for (let i = 0; i < bytecode.length; i++) {
    const instruction = bytecode[i];
    const iData = <i32>instruction < INSTRUCTIONS.length ? INSTRUCTIONS[instruction] : MISSING_INSTRUCTION;
    // We don't know exactly how many bytes would be read...
    const _args = decodeArguments(iData.kind, bytecode.subarray(i + 1));
    // TODO [ToDr] We could possibly encode the arguments back to see how much bytes they would take?
    const skipBytes = REQUIRED_BYTES[iData.kind];
    mask[i] = true;
    i += skipBytes;
  }
  // pack mask
  const packed: u8[] = [];
  for (let i = 0; i < mask.length; i += 8) {
    let byte = 0;
    // TODO [ToDr] Check, might need to go in the other order
    for (let j = i; j < i + 8; j++) {
      if (j < mask.length) {
        byte |= mask[j] ? 1 : 0; 
      } else {
        byte |= 1;
      }
      byte << 1;
    }
  }
  return packed;
}

export class Mask {
  // NOTE: might be longer than code (bit-alignment)
  readonly bytesToSkip: StaticArray<u8>;

  constructor(packedMask: Uint8Array, codeLength: i32) {
    this.bytesToSkip = new StaticArray<u8>(codeLength);
    let lastInstructionOffset: u8 = 0;
    for (let i: i32 = packedMask.length - 1; i >= 0; i -= 1) {
      let bits = packedMask[i];
      const index = i * 8;
      for (let b = 7; b >= 0; b--) {
        const isSet = bits & 0b1000_0000;
        bits = bits << 1;
        if (index + b < codeLength) {
          lastInstructionOffset = isSet ? 0 : lastInstructionOffset + 1;
          this.bytesToSkip[index + b] = lastInstructionOffset;
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

  argsLen(i: u32): u8 {
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
    let inBlock = false;
    for (let i: i32 = 0; i < len; i += 1) {
      const skip = mask.bytesToSkip[i];
      const isInstruction = skip === 0;
      if (isInstruction && !inBlock) {
        inBlock = true;
        isStartOrEnd[i] += BasicBlock.START;
      }
      // in case of start blocks, some of them might be both start & end;
      const iData = code[i] >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[code[i]];
      if (isInstruction && inBlock && iData.isTerminating) {
        inBlock = false;
        isStartOrEnd[i] += BasicBlock.END;
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
      v += `${i} -> ${t}, `;
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

export function decodeArguments(kind: Arguments, data: Uint8Array): Args {
  if (data.length < REQUIRED_BYTES[kind]) {
    return new Args();
  }
  return DECODERS[kind](data);
}
