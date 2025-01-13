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
  /** TwoReg: `omega_A` */
  a: u32 = 0;
  /** TwoReg: `omega'_D` */
  b: u32 = 0;
  c: u32 = 0;
  d: u32 = 0;
}

function asArgs(a: u32, b: u32, c: u32, d: u32): Args {
  const x = new Args();
  x.a = a;
  x.b = b;
  x.c = c;
  x.d = d;
  return x;
}

type ArgsDecoder = (data: Uint8Array, immLimit: u32) => Args;

function twoImm(data: Uint8Array, lim: u32): Args {
  const n = nibbles(data[0]);
  const split = <i32>Math.min(4, n.low) + 1;
  const first = decodeI32(data, 1, split);
  const second = decodeI32(data, split, lim);
  return asArgs(first, second, 0, 0);
}

export const DECODERS: ArgsDecoder[] = [
  // DECODERS[Arguments.Zero] =
  (_d, _l) => {
    return asArgs(0, 0, 0, 0);
  },
  // DECODERS[Arguments.OneImm] =
  (data, lim) => {
    return asArgs(decodeI32(data, 0, lim), 0, 0, 0);
  },
  // DECODERS[Arguments.TwoImm] =
  (data, lim) => twoImm(data, lim),
  // DECODERS[Arguments.OneOff] =
  (data, lim) => {
    return asArgs(decodeI32(data, 0, lim), 0, 0, 0);
  },
  // DECODERS[Arguments.OneRegOneImm] =
  (data, lim) => {
    return asArgs(nibbles(data[0]).low, decodeI32(data, 1, lim), 0, 0);
  },
  // DECODERS[Arguments.OneRegOneExtImm] =
  (data, _lim) => {
    const a = nibbles(data[0]).low;
    const b = decodeU32(data.subarray(1));
    const c = decodeU32(data.subarray(5));
    return asArgs(a, b, c, 0);
  },
  //DECODERS[Arguments.OneRegTwoImm] =
  (data, lim) => {
    const n = nibbles(data[0]);
    const split = <i32>Math.min(4, n.hig) + 1;
    const immA = decodeI32(data, 1, split);
    const immB = decodeI32(data, split, lim);
    return asArgs(n.low, immA, immB, 0);
  },
  // DECODERS[Arguments.OneRegOneImmOneOff] =
  (data, lim) => {
    const n = nibbles(data[0]);
    const split = <i32>Math.min(4, n.hig) + 1;
    const immA = decodeI32(data, 1, split);
    const offs = decodeI32(data, split, lim);
    return asArgs(n.low, immA, offs, 0);
  },
  // DECODERS[Arguments.TwoReg] =
  (data, _lim) => {
    const n = nibbles(data[0]);
    return asArgs(n.hig, n.low, 0, 0);
  },
  // DECODERS[Arguments.TwoRegOneImm] =
  (data, lim) => {
    const n = nibbles(data[0]);
    return asArgs(n.hig, n.low, decodeI32(data, 1, lim), 0);
  },
  // DECODERS[Arguments.TwoRegOneOff] =
  (data, lim) => {
    const n = nibbles(data[0]);
    return asArgs(n.hig, n.low, decodeI32(data, 1, lim), 0);
  },
  // DECODERS[Arguments.TwoRegTwoImm] =
  (data, lim) => {
    const n = nibbles(data[0]);
    const result = twoImm(data.subarray(1), lim > 1 ? lim - 1 : 0);
    return asArgs(n.hig, n.low, result.a, result.b);
  },
  // DECODERS[Arguments.ThreeReg] =
  (data, _lim) => {
    const a = nibbles(data[0]);
    const b = nibbles(data[1]);
    return asArgs(a.hig, a.low, b.low, 0);
  },
];

// @unmanaged
class Nibbles {
  low: u8 = 0;
  hig: u8 = 0;
}

// @inline
export function nibbles(byte: u8): Nibbles {
  const low = byte & 0xf;
  const hig = byte >> 4;
  const n = new Nibbles();
  n.low = low;
  n.hig = hig;
  return n;
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

export function encodeI32(input: i32): u8[] {
  const data: u8[] = [];
  let num = u32(input);
  while (num > 0) {
    data.push(u8(num));
    num >>= 8;
  }
  return data;
}

function decodeU32(data: Uint8Array): u32 {
  let num = u32(data[0]);
  num |= u32(data[1]) << 8;
  num |= u32(data[2]) << 16;
  num |= u32(data[3]) << 24;
  return num;
}
