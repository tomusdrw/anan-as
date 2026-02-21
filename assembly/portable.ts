export class portable {
  // @ts-ignore: parameter type differs between AS and JS
  static asArray<T>(v: T[]): T[] {
    if (ASC_TARGET === 0) {
      // @ts-ignore: JS runtime - v is an iterator, convert to array
      return Array.from(v) as T[];
    }
    return v;
  }

  // --- bswap ---

  static bswap_u16(v: u16): u16 {
    if (ASC_TARGET === 0) {
      return u16(((v & 0xff) << 8) | ((v >> 8) & 0xff));
    }
    return bswap<u16>(v);
  }

  static bswap_u32(v: u32): u32 {
    if (ASC_TARGET === 0) {
      return u32(((v & 0xff) << 24) | ((v & 0xff00) << 8) | ((v >> 8) & 0xff00) | ((v >> 24) & 0xff));
    }
    return bswap<u32>(v);
  }

  static bswap_u64(v: u64): u64 {
    if (ASC_TARGET === 0) {
      const lo = u32(v);
      const hi = u32(v >> u64(32));
      const sLo = portable.bswap_u32(lo);
      const sHi = portable.bswap_u32(hi);
      return u64((u64(sLo) << u64(32)) | u64(sHi));
    }
    return bswap<u64>(v);
  }

  // --- popcnt ---

  static popcnt_u32(v: u32): u32 {
    if (ASC_TARGET === 0) {
      v = v - ((v >>> 1) & 0x55555555);
      v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
      return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
    }
    return popcnt<u32>(v);
  }

  static popcnt_u64(v: u64): u64 {
    if (ASC_TARGET === 0) {
      const lo = portable.popcnt_u32(u32(v));
      const hi = portable.popcnt_u32(u32(v >> u64(32)));
      return u64(lo + hi);
    }
    return popcnt<u64>(v);
  }

  // --- clz ---

  static clz_u32(v: u32): u32 {
    if (ASC_TARGET === 0) {
      // @ts-ignore: Math.clz32 exists in ES2015+
      return <u32>Math.clz32(v);
    }
    return clz<u32>(v);
  }

  static clz_u64(v: u64): u64 {
    if (ASC_TARGET === 0) {
      const hi = u32(v >> u64(32));
      if (hi !== 0) {
        return u64(portable.clz_u32(hi));
      }
      return u64(32 + portable.clz_u32(u32(v)));
    }
    return clz<u64>(v);
  }

  // --- ctz ---

  static ctz_u32(v: u32): u32 {
    if (ASC_TARGET === 0) {
      if (v === 0) return 32;
      // @ts-ignore: Math.clz32 exists in ES2015+
      return <u32>(31 - Math.clz32(v & -v));
    }
    return ctz<u32>(v);
  }

  static ctz_u64(v: u64): u64 {
    if (ASC_TARGET === 0) {
      const lo = u32(v);
      if (lo !== 0) {
        return u64(portable.ctz_u32(lo));
      }
      return u64(32 + portable.ctz_u32(u32(v >> u64(32))));
    }
    return ctz<u64>(v);
  }

  // --- rotr ---

  static rotr_u32(v: u32, shift: u32): u32 {
    if (ASC_TARGET === 0) {
      shift &= 31;
      return u32((v >>> shift) | (v << (32 - shift)));
    }
    return rotr<u32>(v, shift);
  }

  static rotr_u64(v: u64, shift: u64): u64 {
    if (ASC_TARGET === 0) {
      shift &= u64(63);
      return u64((v >> shift) | (v << (u64(64) - shift)));
    }
    return rotr<u64>(v, shift);
  }

  // --- rotl ---

  static rotl_u32(v: u32, shift: u32): u32 {
    if (ASC_TARGET === 0) {
      shift &= 31;
      return u32((v << shift) | (v >>> (32 - shift)));
    }
    return rotl<u32>(v, shift);
  }

  static rotl_u64(v: u64, shift: u64): u64 {
    if (ASC_TARGET === 0) {
      shift &= u64(63);
      return u64((v << shift) | (v >> (u64(64) - shift)));
    }
    return rotl<u64>(v, shift);
  }

  // --- u64 wrapping arithmetic ---

  static u64_add(a: u64, b: u64): u64 {
    if (ASC_TARGET === 0) {
      // @ts-ignore: BigInt
      return BigInt.asUintN(64, BigInt(a) + BigInt(b));
    }
    return a + b;
  }

  static u64_sub(a: u64, b: u64): u64 {
    if (ASC_TARGET === 0) {
      // @ts-ignore: BigInt
      return BigInt.asUintN(64, BigInt(a) - BigInt(b));
    }
    return a - b;
  }

  static u64_mul(a: u64, b: u64): u64 {
    if (ASC_TARGET === 0) {
      // @ts-ignore: BigInt
      return BigInt.asUintN(64, BigInt(a) * BigInt(b));
    }
    return a * b;
  }
}
