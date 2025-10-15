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

type ArgsDecoder = (args: Args, code: u8[], offset: u32, end: u32) => Args;

function twoImm(args: Args, code: u8[], offset: u32, end: u32): Args {
  const low = lowNibble(unchecked(code[offset]));
  const split = <i32>Math.min(4, low) + 1;
  const first = decodeI32(code, offset + 1, offset + split);
  const second = decodeI32(code, offset + split, end);
  return args.fill(first, second, 0, 0);
}

export const DECODERS: ArgsDecoder[] = [
  // DECODERS[Arguments.Zero] =
  (args, _d, _o, _l) => {
    return args.fill(0, 0, 0, 0);
  },
  // DECODERS[Arguments.OneImm] =
  (args, data, o, lim) => {
    return args.fill(decodeI32(data, o, lim), 0, 0, 0);
  },
  // DECODERS[Arguments.TwoImm] =
  (args, data, o, lim) => twoImm(args, data, o, lim),
  // DECODERS[Arguments.OneOff] =
  (args, data, o, lim) => {
    return args.fill(decodeI32(data, o, lim), 0, 0, 0);
  },
  // DECODERS[Arguments.OneRegOneImm] =
  (args, data, o, lim) => {
    return args.fill(lowNibble(data[o]), decodeI32(data, o + 1, lim), 0, 0);
  },
  // DECODERS[Arguments.OneRegOneExtImm] =
  (args, data, o, _lim) => {
    const a = lowNibble(data[o]);
    const b = decodeU32(data, o + 1);
    const c = decodeU32(data, o + 5);
    return args.fill(a, b, c, 0);
  },
  //DECODERS[Arguments.OneRegTwoImm] =
  (args, data, o, lim) => {
    const h = higNibble(data[o]);
    const l = lowNibble(data[o]);
    const split = <i32>Math.min(4, h) + 1;
    const immA = decodeI32(data, o + 1, o + split);
    const immB = decodeI32(data, o + split, lim);
    return args.fill(l, immA, immB, 0);
  },
  // DECODERS[Arguments.OneRegOneImmOneOff] =
  (args, data, o, lim) => {
    const h = higNibble(data[o]);
    const l = lowNibble(data[o]);
    const split = <i32>Math.min(4, h) + 1;
    const immA = decodeI32(data, o + 1, o + split);
    const offs = decodeI32(data, o + split, lim);
    return args.fill(l, immA, offs, 0);
  },
  // DECODERS[Arguments.TwoReg] =
  (args, data, o, _lim) => {
    return args.fill(higNibble(data[o]), lowNibble(data[o]), 0, 0);
  },
  // DECODERS[Arguments.TwoRegOneImm] =
  (args, data, o, lim) => {
    const hig = higNibble(data[o]);
    const low = lowNibble(data[o]);
    return args.fill(hig, low, decodeI32(data, o + 1, lim), 0);
  },
  // DECODERS[Arguments.TwoRegOneOff] =
  (args, data, o, lim) => {
    const hig = higNibble(data[o]);
    const low = lowNibble(data[o]);
    return args.fill(hig, low, decodeI32(data, o + 1, lim), 0);
  },
  // DECODERS[Arguments.TwoRegTwoImm] =
  (args, data, o, lim) => {
    const hig = higNibble(data[o]);
    const low = lowNibble(data[o]);
    const result = twoImm(args, data, o + 1, lim);
    return args.fill(hig, low, result.a, result.b);
  },
  // DECODERS[Arguments.ThreeReg] =
  (args, data, o, _lim) => {
    const hig = higNibble(data[o]);
    const low = lowNibble(data[o]);
    const b = lowNibble(data[o + 1]);
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
function decodeI32(input: u8[], start: u32, end: u32): u32 {
  if (end <= start) {
    return 0;
  }
  const l = end - start;
  const len = l < 4 ? l : 4;
  let num = 0x0;
  for (let i: u32 = 0; i < len; i++) {
    num |= u32(input[start + i]) << (i * 8);
  }
  const msb = unchecked(input[start + len - 1]) & 0x80;
  if (len < 4 && msb > 0) {
    num |= 0xffff_ffff << (len * 8);
  }
  return num;
}

function decodeU32(data: u8[], offset: u32): u32 {
  let num = u32(data[offset + 0]);
  num |= u32(data[offset + 1]) << 8;
  num |= u32(data[offset + 2]) << 16;
  num |= u32(data[offset + 3]) << 24;
  return num;
}
