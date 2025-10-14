export enum Arguments {
  Zero = 0,
  OneImm = 1,
  TwoImm = 2,
  OneOff = 3,
  OneRegOneImm = 4,
  OneRegOneExtImm = 5,
  OneRegTwoImm = 6,
  OneRegOneImmOneOff = 7,
  TwoReg = 8,
  TwoRegOneImm = 9,
  TwoRegOneOff = 10,
  TwoRegTwoImm = 11,
  ThreeReg = 12,
}

/** How many numbers in `Args` is relevant for given `Arguments`. */
export const RELEVANT_ARGS = [<i32>0, 1, 2, 1, 2, 3, 3, 3, 2, 3, 3, 4, 3];
/** How many bytes is required by given `Arguments`. */
export const REQUIRED_BYTES = [<i32>0, 0, 1, 0, 1, 9, 1, 1, 1, 1, 1, 2, 2];

// @unmanaged
export class Args {
  fill(a: u32, b: u32 = 0, c: u32 = 0, d: u32 = 0): Args {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    return this;
  }

  /**
   * TwoReg: `omega_A`
   * TwoRegOneOff: `omega_B`
   * ThreeReg: `omega_B`
   */
  a: u32 = 0;
  /**
   * TwoReg: `omega'_D`
   * TwoRegOneOff: `omega'_A`
   * ThreeReg: `omega_A`
   */
  b: u32 = 0;
  /**
   * ThreeReg: `omega'_D`
   */
  c: u32 = 0;
  d: u32 = 0;
}

type ArgsDecoder = (args: Args, data: Uint8Array, immLimit: u32) => Args;

function twoImm(args: Args, data: Uint8Array, lim: u32): Args {
  const low = lowNibble(data[0]);
  const split = <i32>Math.min(4, low) + 1;
  const first = decodeI32(data, 1, split);
  const second = decodeI32(data, split, lim);
  return args.fill(first, second, 0, 0);
}

export const DECODERS: ArgsDecoder[] = [
  // DECODERS[Arguments.Zero] =
  (args, _d, _l) => {
    return args.fill(0, 0, 0, 0);
  },
  // DECODERS[Arguments.OneImm] =
  (args, data, lim) => {
    return args.fill(decodeI32(data, 0, lim), 0, 0, 0);
  },
  // DECODERS[Arguments.TwoImm] =
  (args, data, lim) => twoImm(args, data, lim),
  // DECODERS[Arguments.OneOff] =
  (args, data, lim) => {
    return args.fill(decodeI32(data, 0, lim), 0, 0, 0);
  },
  // DECODERS[Arguments.OneRegOneImm] =
  (args, data, lim) => {
    return args.fill(lowNibble(data[0]), decodeI32(data, 1, lim), 0, 0);
  },
  // DECODERS[Arguments.OneRegOneExtImm] =
  (args, data, _lim) => {
    const a = lowNibble(data[0]);
    const b = decodeU32(data.subarray(1));
    const c = decodeU32(data.subarray(5));
    return args.fill(a, b, c, 0);
  },
  //DECODERS[Arguments.OneRegTwoImm] =
  (args, data, lim) => {
    const h = higNibble(data[0]);
    const l = lowNibble(data[0]);
    const split = <i32>Math.min(4, h) + 1;
    const immA = decodeI32(data, 1, split);
    const immB = decodeI32(data, split, lim);
    return args.fill(l, immA, immB, 0);
  },
  // DECODERS[Arguments.OneRegOneImmOneOff] =
  (args, data, lim) => {
    const h = higNibble(data[0]);
    const l = lowNibble(data[0]);
    const split = <i32>Math.min(4, h) + 1;
    const immA = decodeI32(data, 1, split);
    const offs = decodeI32(data, split, lim);
    return args.fill(l, immA, offs, 0);
  },
  // DECODERS[Arguments.TwoReg] =
  (args, data, _lim) => {
    return args.fill(higNibble(data[0]), lowNibble(data[0]), 0, 0);
  },
  // DECODERS[Arguments.TwoRegOneImm] =
  (args, data, lim) => {
    const hig = higNibble(data[0]);
    const low = lowNibble(data[0]);
    return args.fill(hig, low, decodeI32(data, 1, lim), 0);
  },
  // DECODERS[Arguments.TwoRegOneOff] =
  (args, data, lim) => {
    const hig = higNibble(data[0]);
    const low = lowNibble(data[0]);
    return args.fill(hig, low, decodeI32(data, 1, lim), 0);
  },
  // DECODERS[Arguments.TwoRegTwoImm] =
  (args, data, lim) => {
    const hig = higNibble(data[0]);
    const low = lowNibble(data[0]);
    const result = twoImm(args, data.subarray(1), lim > 1 ? lim - 1 : 0);
    return args.fill(hig, low, result.a, result.b);
  },
  // DECODERS[Arguments.ThreeReg] =
  (args, data, _lim) => {
    const hig = higNibble(data[0]);
    const low = lowNibble(data[0]);
    const b = lowNibble(data[1]);
    return args.fill(hig, low, b, 0);
  },
];

// @inline
export function lowNibble(byte: u8): u8 {
  return byte & 0xf;
}
export function higNibble(byte: u8): u8 {
  return byte >> 4;
}

//@inline
function decodeI32(input: Uint8Array, start: u32, end: u32): u32 {
  const data = input.subarray(start, end > start ? end : start);
  const len = <u32>Math.min(4, data.length);
  let num = 0;
  for (let i: u32 = 0; i < len; i++) {
    num |= u32(data[i]) << (i * 8);
  }

  const msb = len > 0 ? data[len - 1] & 0x80 : 0;
  const prefix = msb > 0 ? 0xff : 0x00;
  for (let i: u32 = len; i < 4; i++) {
    num |= prefix << (i * 8);
  }
  return num;
}

function decodeU32(data: Uint8Array): u32 {
  let num = u32(data[0]);
  num |= u32(data[1]) << 8;
  num |= u32(data[2]) << 16;
  num |= u32(data[3]) << 24;
  return num;
}
