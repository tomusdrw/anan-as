// Polyfills for AssemblyScript types not included in the portable runtime
// These provide basic compatibility - you should replace with proper implementations

// Make StaticArray an alias for Array at runtime
(globalThis as any).StaticArray = Array;

// Helper functions for i64/u64 with MAX_VALUE and MIN_VALUE
const i64Fn = function(value: any): bigint {
  return BigInt(value);
};
i64Fn.MAX_VALUE = 9223372036854775807n;
i64Fn.MIN_VALUE = -9223372036854775808n;
(globalThis as any).i64 = i64Fn;

const u64Fn = function(value: any): bigint {
  return BigInt(value);
};
u64Fn.MAX_VALUE = 18446744073709551615n;
u64Fn.MIN_VALUE = 0n;
(globalThis as any).u64 = u64Fn;

declare global {
  // StaticArray polyfill - use regular Array constructor both as type and value
  interface StaticArray<T> extends Array<T> {}
  var StaticArray: typeof Array;

  // i64 and u64 as both types and callable functions with constants
  type i64 = bigint;
  type u64 = bigint;

  interface I64Function {
    (value: any): i64;
    MAX_VALUE: i64;
    MIN_VALUE: i64;
  }

  interface U64Function {
    (value: any): u64;
    MAX_VALUE: u64;
    MIN_VALUE: u64;
  }

  var i64: I64Function;
  var u64: U64Function;

  // Add DataView extensions
  interface DataView {
    setUint64(byteOffset: number, value: u64, littleEndian?: boolean): void;
    getUint64(byteOffset: number, littleEndian?: boolean): u64;
  }

  namespace console {
    function log(msg: string): void;
  }

  // Make MapIterator behave like Array for AS compatibility
  interface MapIterator<T> extends IterableIterator<T> {
    length: number;
    [index: number]: T;
  }
}

// Add DataView.setUint64 polyfill (simplified - just uses two 32-bit values)
if (!(DataView.prototype as any).setUint64) {
  (DataView.prototype as any).setUint64 = function(byteOffset: number, value: bigint, littleEndian?: boolean) {
    // Simple polyfill - split into two 32-bit values
    const high = value / 0x1_0000_0000n;
    const low = value & 0xffff_ffffn; 
    if (littleEndian) {
      this.setUint32(byteOffset, low, true);
      this.setUint32(byteOffset + 4, high, true);
    } else {
      this.setUint32(byteOffset, high, false);
      this.setUint32(byteOffset + 4, low, false);
    }
  };
}

if (!(DataView.prototype as any).getUint64) {
  (DataView.prototype as any).getUint64 = function(byteOffset: number, littleEndian?: boolean): bigint {
    if (littleEndian) {
      const low = BigInt(this.getUint32(byteOffset, true));
      const high = BigInt(this.getUint32(byteOffset + 4, true));
      return high * 0x1_0000_0000n + low;
    } else {
      const high = BigInt(this.getUint32(byteOffset, false));
      const low = BigInt(this.getUint32(byteOffset + 4, false));
      return high * 0x1_0000_0000n + low;
    }
  };
}

export {};
