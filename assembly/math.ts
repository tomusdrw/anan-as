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
  const aHigh = a >> 32;
  const aLow = a & 0xffff_ffff;
  const bHigh = b >> 32;
  const bLow = b & 0xffff_ffff;

  const lowLow = aLow * bLow;
  const lowHigh = aLow * bHigh;
  const highLow = aHigh * bLow;
  const highHigh = aHigh * bHigh;
  const carry = (lowLow >> 32) + (lowHigh & 0xffff_ffff) + (highLow & 0xffff_ffff);

  return highHigh + (lowLow >> 32) + (highLow >> 32) + (carry >> 32);
}

/**
 * Same as [mulUpperUnsigned] but treat the arguments as signed (two-complement) 64-bit numbers and the result alike.
 */
export function mulUpperSigned(a: i64, b: i64): i64 {
  const aSign = (a & 0x80) === 0x80 ? 1 : -1;
  const bSign = (b & 0x80) === 0x80 ? 1 : -1;
  const sign = aSign * bSign;
  const aAbs = a < 0 ? ~a + 1 : a;
  const bAbs = b < 0 ? ~b + 1 : b;

  if (sign < 0) {
    return ~mulUpperUnsigned(aAbs, bAbs) + 1;
  }
  return mulUpperUnsigned(aAbs, bAbs);
}
