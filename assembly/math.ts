export class IntMath {
  /** Integer minimum of two i32 values. */
  @inline
  static minI32(a: i32, b: i32): i32 {
    return a < b ? a : b;
  }

  /** Unsigned integer minimum of two u32 values. */
  @inline
  static minU32(a: u32, b: u32): u32 {
    return a < b ? a : b;
  }
}
