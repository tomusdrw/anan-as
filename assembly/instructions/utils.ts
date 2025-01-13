import { NO_OF_REGISTERS } from "../registers";

/**
 * Multiply two unsigned 64-bit numbers and take the upper 64-bits of the result.
 *  
 * The result of multiplication is a 128-bits number and we are only interested in the part that lands in the upper 64-bits.
 * For example (for 32-bit case) if we multiply `0xffffffff * 0xffffffff`, we get:
 
 * |   32-bits  |   32-bits  |
 * +------------+------------+
 * |    upper   |    lower   |
 * | 0xfffffffe | 0x00000001 |
 *
 * So `0xfffffffe` is returned.
 */
export function mulUpperUnsigned(a: u64, b: u64): u64 {
  const aHigh: u64 = a >> 32;
  const aLow: u64 = a & 0xffff_ffff;
  const bHigh: u64 = b >> 32;
  const bLow: u64 = b & 0xffff_ffff;

  const lowLow = aLow * bLow;
  const lowHigh = aLow * bHigh;
  const highLow = aHigh * bLow;
  const highHigh = aHigh * bHigh;
  const carry = (lowLow >> 32) + (lowHigh & 0xffff_ffff) + (highLow & 0xffff_ffff);

  return highHigh + (lowHigh >> 32) + (highLow >> 32) + (carry >> 32);
}

/**
 * Same as [mulUpperUnsigned] but treat the arguments as signed (two-complement) 64-bit numbers and the result alike.
 */
export function mulUpperSigned(a: i64, b: i64): u64 {
  let isResultNegative = false;
  let aAbs = a;
  let bAbs = b;
  if (a < 0) {
    isResultNegative = !isResultNegative;
    aAbs = ~a + 1;
  }
  if (b < 0) {
    isResultNegative = !isResultNegative;
    bAbs = ~b + 1;
  }

  if (isResultNegative) {
    const upper = mulUpperUnsigned(aAbs, bAbs);
    const lower = aAbs * bAbs;
    return ~upper + (lower === 0 ? 1 : 0);
  }

  return mulUpperUnsigned(aAbs, bAbs);
}

export function mulUpperSignedUnsigned(a: i64, b: u64): u64 {
  if (a < 0) {
    const aAbs: u64 = ~a + 1;
    const upper = mulUpperUnsigned(aAbs, b);
    const lower = aAbs * b;
    return ~upper + (lower === 0 ? 1 : 0);
  }
  return mulUpperUnsigned(a, b);
}

// @inline
export function u8SignExtend(v: u8): i64 {
  return i64(i32(i16(i8(v))));
}

// @inline
export function u16SignExtend(v: u16): i64 {
  return i64(i32(i16(v)));
}

// @inline
export function u32SignExtend(v: u32): i64 {
  return i64(i32(v));
}

// @inline
export function reg(v: u64): u32 {
  return v >= u64(NO_OF_REGISTERS) ? NO_OF_REGISTERS - 1 : u32(v);
}
