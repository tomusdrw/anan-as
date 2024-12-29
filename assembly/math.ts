import { NO_OF_REGISTERS } from "./registers";

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
  const aSign = a < 0 ? 1 : -1;
  const bSign = b < 0 ? 1 : -1;
  const sign = aSign * bSign;
  const aAbs = a < 0 ? ~a + 1 : a;
  const bAbs = b < 0 ? ~b + 1 : b;

  if (sign < 0) {
    return ~mulUpperUnsigned(aAbs, bAbs) + 1;
  }
  return mulUpperUnsigned(aAbs, bAbs);
}

export function mulUpperSignedUnsigned(a: i64, b: u64): u64 {
  const aSign = a < 0 ? 1 : -1;
  if (aSign < 0) {
    const aAbs = ~a + 1;
    return ~mulUpperUnsigned(aAbs, b) + 1;
  }
  return mulUpperUnsigned(a, b);
}

// @inline
export function u32SignExtend(v: u32): i64 {
  return i64(i32(v));
}

// @inline
export function reg(v: u64): u32 {
  return v >= u64(NO_OF_REGISTERS) ? NO_OF_REGISTERS - 1 : u32(v);
}

export const MAX_SHIFT_64 = 64;
export const MAX_SHIFT_32 = 32;
