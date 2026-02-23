// Polyfills for AssemblyScript types not included in the portable runtime.
// These provide JS-compatible implementations of AS built-in types and functions.

// biome-ignore lint/suspicious/noExplicitAny: AS compatibility - extending globalThis
const g = globalThis as any;

// --- StaticArray → Array (filled with 0 to match AS behavior) ---
g.StaticArray = class StaticArray extends Array {
  constructor(length: number) {
    super(length);
    this.fill(0);
  }
};

// --- ASC_TARGET for portable build ---
g.ASC_TARGET = 0;

// --- i8 cast ---
g.i8 = (value: any): any => {
  const n = typeof value === "bigint" ? Number(value) : value;
  return (n << 24) >> 24;
};

// --- i16 cast ---
g.i16 = (value: any): any => {
  const n = typeof value === "bigint" ? Number(value) : value;
  return (n << 16) >> 16;
};

// --- i32 cast ---
const i32Fn = (value: any): any => {
  if (typeof value === "bigint") {
    return Number(BigInt.asIntN(32, value));
  }
  return value | 0;
};
i32Fn.MIN_VALUE = -2147483648;
i32Fn.MAX_VALUE = 2147483647;
g.i32 = i32Fn;

// --- i64 cast ---
const i64Fn = (value: any): any => {
  return BigInt.asIntN(64, BigInt(value));
};
i64Fn.MAX_VALUE = 9223372036854775807n;
i64Fn.MIN_VALUE = -9223372036854775808n;
g.i64 = i64Fn;

// --- u8 cast ---
g.u8 = (v: any): any => {
  if (typeof v === "bigint") {
    return Number(v & 0xffn) >>> 0;
  }
  return (v & 0xff) >>> 0;
};

// --- u16 cast ---
g.u16 = (v: any): any => {
  if (typeof v === "bigint") {
    return Number(v & 0xffffn) >>> 0;
  }
  return (v & 0xffff) >>> 0;
};

// --- u32 cast ---
g.u32 = (v: any): any => {
  if (typeof v === "bigint") {
    return Number(v & 0xffff_ffffn) >>> 0;
  }
  return (v & 0xffff_ffff) >>> 0;
};

// --- u64 cast ---
const u64Fn = (value: any): any => {
  return BigInt.asUintN(64, BigInt(value));
};
u64Fn.MAX_VALUE = 18446744073709551615n;
u64Fn.MIN_VALUE = 0n;
g.u64 = u64Fn;

// --- f32/f64 casts ---
g.f32 = (v: any): any => Math.fround(v);
g.f64 = (v: any): any => +v;

// --- bool cast ---
g.bool = (v: any): any => !!v;

// --- DataView u64 polyfills ---

// biome-ignore lint/suspicious/noExplicitAny: extending DataView prototype
const DataViewProto = DataView.prototype as any;

if (!DataViewProto.setUint64) {
  DataViewProto.setUint64 = function (byteOffset: number, value: bigint, littleEndian?: boolean) {
    const high = Number((value >> 32n) & 0xffff_ffffn);
    const low = Number(value & 0xffff_ffffn);
    if (littleEndian) {
      this.setUint32(byteOffset, low, true);
      this.setUint32(byteOffset + 4, high, true);
    } else {
      this.setUint32(byteOffset, high, false);
      this.setUint32(byteOffset + 4, low, false);
    }
  };
}

if (!DataViewProto.getUint64) {
  DataViewProto.getUint64 = function (byteOffset: number, littleEndian?: boolean): bigint {
    if (littleEndian) {
      const low = BigInt(this.getUint32(byteOffset, true));
      const high = BigInt(this.getUint32(byteOffset + 4, true));
      return (high << 32n) | low;
    }
    const high = BigInt(this.getUint32(byteOffset, false));
    const low = BigInt(this.getUint32(byteOffset + 4, false));
    return (high << 32n) | low;
  };
}

// --- AS built-in function polyfills ---
// clz, ctz, popcnt, rotl, rotr, bswap are provided by assemblyscript/std/portable
// But they only work for 32-bit numbers. Our portable.ts handles the 64-bit cases.

// unchecked - identity
g.unchecked = (v: any): any => v;

// inline - no-op decorator (AS-only optimization hint)
g.inline = () => {};  // no-op; in AS this is @inline decorator

// changetype - identity
g.changetype = (v: any): any => v;

export {};
