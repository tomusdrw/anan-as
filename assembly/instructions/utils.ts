import {portable} from "../portable";
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
  const aHigh: u64 = a >> u64(32);
  const aLow: u64 = a & u64(0xffff_ffff);
  const bHigh: u64 = b >> u64(32);
  const bLow: u64 = b & u64(0xffff_ffff);

  const lowLow = portable.u64_mul(aLow, bLow);
  const lowHigh = portable.u64_mul(aLow, bHigh);
  const highLow = portable.u64_mul(aHigh, bLow);
  const highHigh = portable.u64_mul(aHigh, bHigh);
  const carry = portable.u64_add(
    (lowLow >> u64(32)),
    portable.u64_add((lowHigh & u64(0xffff_ffff)), (highLow & u64(0xffff_ffff)))
  );

  const r1 = portable.u64_add(highHigh, (lowHigh >> u64(32)));
  const r2 = portable.u64_add((highLow >> u64(32)), (carry >> u64(32)));
  return portable.u64_add(r1, r2);
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
    aAbs = portable.u64_add(~a, u64(1));
  }
  if (b < 0) {
    isResultNegative = !isResultNegative;
    bAbs = portable.u64_add(~b, u64(1));
  }

  if (isResultNegative) {
    const upper = mulUpperUnsigned(aAbs, bAbs);
    const lower = portable.u64_mul(aAbs, bAbs);
    return portable.u64_add(~upper, u64(lower === u64(0) ? 1 : 0));
  }

  return mulUpperUnsigned(aAbs, bAbs);
}

export function mulUpperSignedUnsigned(a: i64, b: u64): u64 {
  if (a < 0) {
    const aAbs: u64 = portable.u64_add(~a, u64(1));
    const upper = mulUpperUnsigned(aAbs, b);
    const lower = portable.u64_mul(aAbs, b);
    return portable.u64_add(~upper, u64(lower === u64(0) ? 1 : 0));
  }
  return mulUpperUnsigned(a, b);
}

// @inline
export function u8SignExtend(v: u8): u64 {
  return u64(i64(i32(i16(i8(v)))));
}

// @inline
export function u16SignExtend(v: u16): u64 {
  return u64(i64(i32(i16(v))));
}

// @inline
export function u32SignExtend(v: u32): u64 {
  return u64(i64(i32(v)));
}

// @inline
export function reg(v: u32): u32 {
  return v >= u64(NO_OF_REGISTERS) ? NO_OF_REGISTERS - 1 : u32(v);
}
