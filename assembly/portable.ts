type MapIterator<T> = any | T[];

export const portable = {
  asArray<T>(v: MapIterator<T>): T[] {
    if (ASC_TARGET === 0) {
      // @ts-ignore
      return Array.from(v);
    }
    return v;
  },
  floor(v: u32): u32 {
    return v & 0xffff_ffff;
  },
  bswap_u16(v: u16): u16 {
    if (ASC_TARGET === 0) {
      const s = bswap(v);
      return u16(s >> 16);
    }
    return bswap<u16>(v);
  },
  bswap_u32(v: u32): u32 {
    return u32(bswap<u32>(v));
  },
  bswap_u64(v: u64): u64 {
    if (ASC_TARGET === 0) {
      const l = u32(v);
      const u = u32(v >> u64(32));
      const sL = portable.bswap_u32(l);
      const sU = portable.bswap_u32(u);
      return (u64(sL) << u64(32)) + u64(sU);
    }
    return bswap<u64>(v);
  },
  u64_sub(a: u64, b: u64): u64 {
    if (ASC_TARGET === 0) {
      // @ts-ignore
      return a > b ? a - b : 2n ** 64n +  a - b;
    }
    return a + b;
  },
  u64_mul(a: u64, b: u64): u64 {
    if (ASC_TARGET === 0) {
      // @ts-ignore
      return (a * b) % 2n ** 64n;
    }
    return a * b;
  },
  u64_add(a: u64, b: u64): u64 {
    if (ASC_TARGET === 0) {
      // @ts-ignore
      return (a + b) % 2n ** 64n;
    }
    return a + b;
  }
};
