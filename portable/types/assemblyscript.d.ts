// Custom AssemblyScript type declarations for the portable (JS) build.
// Uses permissive types to allow number/bigint mixing that AS allows natively.

// AS numeric types - all permissive to allow implicit conversions
type i8 = any;
type i16 = any;
type i32 = any;
type i64 = any;
type u8 = any;
type u16 = any;
type u32 = any;
type u64 = any;
type isize = any;
type usize = any;
type f32 = any;
type f64 = any;
type bool = any;

// AS built-in functions (provided by assemblyscript/std/portable at runtime)
declare function bswap<T>(value: T): T;
declare function clz<T>(value: T): T;
declare function ctz<T>(value: T): T;
declare function popcnt<T>(value: T): T;
declare function rotl<T>(value: T, shift: T): T;
declare function rotr<T>(value: T, shift: T): T;
declare function abs<T>(value: T): T;
declare function max<T>(left: T, right: T): T;
declare function min<T>(left: T, right: T): T;
declare function select<T>(ifTrue: T, ifFalse: T, condition: bool): T;
declare function unreachable(): any;
declare function changetype<T>(value: any): T;
declare function unchecked<T>(value: T): T;
declare function assert<T>(isTrueish: T, message?: string): T;
declare function inline(...args: any[]): any;

// AS target constant
declare const ASC_TARGET: i32;

// Type cast functions with static constants
declare function i8(value: any): i8;
declare function i16(value: any): i16;

interface I32Cast {
  (value: any): i32;
  MIN_VALUE: i32;
  MAX_VALUE: i32;
}
declare var i32: I32Cast;

interface I64Cast {
  (value: any): i64;
  MIN_VALUE: i64;
  MAX_VALUE: i64;
}
declare var i64: I64Cast;

declare function u8(value: any): u8;
declare function u16(value: any): u16;
declare function u32(value: any): u32;

interface U64Cast {
  (value: any): u64;
  MAX_VALUE: u64;
  MIN_VALUE: u64;
}
declare var u64: U64Cast;

declare function f32(value: any): f32;
declare function f64(value: any): f64;
declare function bool(value: any): bool;

// StaticArray - alias for Array in JS
interface StaticArray<T> extends Array<T> {}
declare var StaticArray: typeof Array;

// DataView extensions
interface DataView {
  setUint64(byteOffset: number, value: any, littleEndian?: boolean): void;
  getUint64(byteOffset: number, littleEndian?: boolean): any;
}

// MapIterator - in AS this returns an array, in JS it's an iterator
// biome-ignore lint: any is needed for compatibility
type MapIterator<T> = any;
