// Runtime binding for TS decorator emit in portable JS builds.
const inline = (_target: i32 = 0, _propertyKey: i32 = 0, descriptor: i32 = 0): i32 => descriptor;

export class portable {
  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static installPolyfills(): void {
    if (ASC_TARGET !== 0) {
      return;
    }

    // @ts-ignore: JS runtime only
    const g = globalThis as any;
    if (g.__ananPortablePolyfillsInstalled) {
      return;
    }
    g.__ananPortablePolyfillsInstalled = true;

    // StaticArray -> Array with AS-like zero-initialized length constructor.
    g.StaticArray = function StaticArray(length: number): any {
      const arr = new Array(length);
      arr.fill(0);
      return arr;
    };

    g.ASC_TARGET = 0;

    g.i8 = (value: any): any => {
      const n = typeof value === "bigint" ? Number(value) : value;
      return (n << 24) >> 24;
    };

    g.i16 = (value: any): any => {
      const n = typeof value === "bigint" ? Number(value) : value;
      return (n << 16) >> 16;
    };

    const i32Fn = (value: any): any => {
      if (typeof value === "bigint") {
        return Number(BigInt.asIntN(32, value));
      }
      return value | 0;
    };
    i32Fn.MIN_VALUE = -2147483648;
    i32Fn.MAX_VALUE = 2147483647;
    g.i32 = i32Fn;

    const i64Fn = (value: any): any => {
      return BigInt.asIntN(64, BigInt(value));
    };
    i64Fn.MAX_VALUE = BigInt("9223372036854775807");
    i64Fn.MIN_VALUE = BigInt("-9223372036854775808");
    g.i64 = i64Fn;

    g.u8 = (v: any): any => {
      if (typeof v === "bigint") {
        return Number(v & BigInt(0xff)) >>> 0;
      }
      return (v & 0xff) >>> 0;
    };

    g.u16 = (v: any): any => {
      if (typeof v === "bigint") {
        return Number(v & BigInt(0xffff)) >>> 0;
      }
      return (v & 0xffff) >>> 0;
    };

    g.u32 = (v: any): any => {
      if (typeof v === "bigint") {
        return Number(v & BigInt(0xffff_ffff)) >>> 0;
      }
      return (v & 0xffff_ffff) >>> 0;
    };

    const u64Fn = (value: any): any => {
      return BigInt.asUintN(64, BigInt(value));
    };
    u64Fn.MAX_VALUE = BigInt("18446744073709551615");
    u64Fn.MIN_VALUE = BigInt(0);
    g.u64 = u64Fn;

    g.f32 = (v: any): any => Math.fround(v);
    g.f64 = (v: any): any => +v;
    g.bool = (v: any): any => !!v;

    const dataViewProto = DataView.prototype as any;
    if (!dataViewProto.setUint64) {
      dataViewProto.setUint64 = function (byteOffset: number, value: bigint, littleEndian?: boolean): void {
        const high = Number((value >> BigInt(32)) & BigInt(0xffff_ffff));
        const low = Number(value & BigInt(0xffff_ffff));
        if (littleEndian) {
          this.setUint32(byteOffset, low, true);
          this.setUint32(byteOffset + 4, high, true);
        } else {
          this.setUint32(byteOffset, high, false);
          this.setUint32(byteOffset + 4, low, false);
        }
      };
    }

    if (!dataViewProto.getUint64) {
      dataViewProto.getUint64 = function (byteOffset: number, littleEndian?: boolean): bigint {
        if (littleEndian) {
          const low = BigInt(this.getUint32(byteOffset, true));
          const high = BigInt(this.getUint32(byteOffset + 4, true));
          return (high << BigInt(32)) | low;
        }
        const high = BigInt(this.getUint32(byteOffset, false));
        const low = BigInt(this.getUint32(byteOffset + 4, false));
        return (high << BigInt(32)) | low;
      };
    }

    g.unchecked = (v: any): any => v;
    g.inline = inline;
    g.changetype = (v: any): any => v;
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  // @ts-ignore: parameter type differs between AS and JS
  static asArray<T>(v: T[]): T[] {
    if (ASC_TARGET === 0) {
      // @ts-ignore: JS runtime - v is an iterator, convert to array
      return Array.from(v) as T[];
    }
    return v;
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static arrayAt<T>(v: T[], i: u32): T {
    if (ASC_TARGET === 0) {
      return v[i];
    }
    return unchecked(v[i]);
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static staticArrayAt<T>(v: StaticArray<T>, i: u32): T {
    if (ASC_TARGET === 0) {
      return v[i];
    }
    return unchecked(v[i]);
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static asU32(v: u32): u32 {
    if (ASC_TARGET === 0) {
      return v >>> 0;
    }
    return v;
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static uint8ArrayView(data: ArrayBuffer, offset: i32, length: i32): Uint8Array {
    if (ASC_TARGET === 0) {
      // @ts-ignore: JS runtime supports Uint8Array(buffer, offset, length)
      return new Uint8Array(data, offset, length);
    }
    // @ts-ignore: Uint8Array.wrap is an AS-only API
    return Uint8Array.wrap(data, offset, length);
  }

  // --- bswap ---

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static bswap_u16(v: u16): u16 {
    if (ASC_TARGET === 0) {
      return u16(((v & 0xff) << 8) | ((v >> 8) & 0xff));
    }
    return bswap<u16>(v);
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static bswap_u32(v: u32): u32 {
    if (ASC_TARGET === 0) {
      return u32(((v & 0xff) << 24) | ((v & 0xff00) << 8) | ((v >> 8) & 0xff00) | ((v >> 24) & 0xff));
    }
    return bswap<u32>(v);
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
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

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static popcnt_u32(v: u32): u32 {
    if (ASC_TARGET === 0) {
      v = v - ((v >>> 1) & 0x55555555);
      v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
      return (((v + (v >>> 4)) & 0x0f0f0f0f) * 0x01010101) >>> 24;
    }
    return popcnt<u32>(v);
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static popcnt_u64(v: u64): u64 {
    if (ASC_TARGET === 0) {
      const lo = portable.popcnt_u32(u32(v));
      const hi = portable.popcnt_u32(u32(v >> u64(32)));
      return u64(lo + hi);
    }
    return popcnt<u64>(v);
  }

  // --- clz ---

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static clz_u32(v: u32): u32 {
    if (ASC_TARGET === 0) {
      // @ts-ignore: Math.clz32 exists in ES2015+
      return <u32>Math.clz32(v);
    }
    return clz<u32>(v);
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
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

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static ctz_u32(v: u32): u32 {
    if (ASC_TARGET === 0) {
      if (v === 0) return 32;
      // @ts-ignore: Math.clz32 exists in ES2015+
      return <u32>(31 - Math.clz32(v & -v));
    }
    return ctz<u32>(v);
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
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

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static rotr_u32(v: u32, shift: u32): u32 {
    if (ASC_TARGET === 0) {
      shift &= 31;
      return u32((v >>> shift) | (v << (32 - shift)));
    }
    return rotr<u32>(v, shift);
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static rotr_u64(v: u64, shift: u64): u64 {
    if (ASC_TARGET === 0) {
      shift &= u64(63);
      return u64((v >> shift) | (v << (u64(64) - shift)));
    }
    return rotr<u64>(v, shift);
  }

  // --- rotl ---

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static rotl_u32(v: u32, shift: u32): u32 {
    if (ASC_TARGET === 0) {
      shift &= 31;
      return u32((v << shift) | (v >>> (32 - shift)));
    }
    return rotl<u32>(v, shift);
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static rotl_u64(v: u64, shift: u64): u64 {
    if (ASC_TARGET === 0) {
      shift &= u64(63);
      return u64((v << shift) | (v >> (u64(64) - shift)));
    }
    return rotl<u64>(v, shift);
  }

  // --- u64 wrapping arithmetic ---

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static u64_add(a: u64, b: u64): u64 {
    if (ASC_TARGET === 0) {
      // @ts-ignore: BigInt
      return BigInt.asUintN(64, BigInt(a) + BigInt(b));
    }
    return a + b;
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static u64_sub(a: u64, b: u64): u64 {
    if (ASC_TARGET === 0) {
      // @ts-ignore: BigInt
      return BigInt.asUintN(64, BigInt(a) - BigInt(b));
    }
    return a - b;
  }

  // @ts-ignore: @inline is an AS-only decorator
  @inline
  static u64_mul(a: u64, b: u64): u64 {
    if (ASC_TARGET === 0) {
      // @ts-ignore: BigInt
      return BigInt.asUintN(64, BigInt(a) * BigInt(b));
    }
    return a * b;
  }
}

portable.installPolyfills();
