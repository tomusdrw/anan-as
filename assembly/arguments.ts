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
export const REQUIRED_BYTES = [<i32>0, 0, 0, 0, 1, 9, 1, 1, 1, 1, 1, 1, 2];

// @unmanaged
export class Args {
  a: u32 = 0;
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

type ArgsDecoder = (data: Uint8Array) => Args;

function twoImm(data: Uint8Array): Args {
  if (data.length === 0) {
    return asArgs(0, 0, 0, 0);
  }
  const n = nibbles(data[0]);
  const split = n.low + 1;
  const first = decodeI32(data.subarray(1, split));
  const second = decodeI32(data.subarray(split));
  return asArgs(first, second, 0, 0);
}

export const DECODERS: ArgsDecoder[] = [
  // DECODERS[Arguments.Zero] =
  (_) => {
    return asArgs(0, 0, 0, 0);
  },
  // DECODERS[Arguments.OneImm] =
  (data: Uint8Array) => {
    return asArgs(decodeI32(data), 0, 0, 0);
  },
  // DECODERS[Arguments.TwoImm] =
  (data: Uint8Array) => twoImm(data),
  // DECODERS[Arguments.OneOff] =
  (data: Uint8Array) => {
    return asArgs(decodeI32(data), 0, 0, 0);
  },
  // DECODERS[Arguments.OneRegOneImm] =
  (data: Uint8Array) => {
    return asArgs(nibbles(data[0]).low, decodeI32(data.subarray(1)), 0, 0);
  },
  // DECODERS[Arguments.OneRegOneExtImm] =
  (data: Uint8Array) => {
    const a = nibbles(data[0]).low;
    const b = decodeU32(data.subarray(1));
    const c = decodeU32(data.subarray(5));
    return asArgs(a, b, c, 0);
  },
  //DECODERS[Arguments.OneRegTwoImm] =
  (data: Uint8Array) => {
    const first = nibbles(data[0]);
    const split = first.hig + 1;
    const immA = decodeI32(data.subarray(1, split));
    const immB = decodeI32(data.subarray(split));
    return asArgs(first.low, immA, immB, 0);
  },
  // DECODERS[Arguments.OneRegOneImmOneOff] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    const split = n.hig + 1;
    const immA = decodeI32(data.subarray(1, split));
    const offs = decodeI32(data.subarray(split));
    return asArgs(n.low, immA, offs, 0);
  },
  // DECODERS[Arguments.TwoReg] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    return asArgs(n.hig, n.low, 0, 0);
  },
  // DECODERS[Arguments.TwoRegOneImm] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    return asArgs(n.hig, n.low, decodeI32(data.subarray(1)), 0);
  },
  // DECODERS[Arguments.TwoRegOneOff] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    return asArgs(n.hig, n.low, decodeI32(data.subarray(1)), 0);
  },
  // DECODERS[Arguments.TwoRegTwoImm] =
  (data: Uint8Array) => {
    const n = nibbles(data[0]);
    const result = twoImm(data.subarray(1));
    return asArgs(n.hig, n.low, result.a, result.b);
  },
  // DECODERS[Arguments.ThreeReg] =
  (data: Uint8Array) => {
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
function nibbles(byte: u8): Nibbles {
  const low = byte & 0xf;
  const hig = byte >> 4;
  const n = new Nibbles();
  n.low = low;
  n.hig = hig;
  return n;
}

//@inline
function decodeI32(data: Uint8Array): u32 {
  const len = <u32>data.length;
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
