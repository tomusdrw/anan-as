/** Exported memory */
export declare const memory: WebAssembly.Memory;
/** assembly/index/InputKind */
export declare enum InputKind {
  /** @type `i32` */
  Generic,
  /** @type `i32` */
  SPI,
}
/** assembly/index/HasMetadata */
export declare enum HasMetadata {
  /** @type `i32` */
  Yes,
  /** @type `i32` */
  No,
}
/**
 * assembly/index/disassemble
 * @param input `~lib/array/Array<u8>`
 * @param kind `i32`
 * @param withMetadata `i32`
 * @returns `~lib/string/String`
 */
export declare function disassemble(input: Array<number>, kind: number, withMetadata: number): string;
/**
 * assembly/index/runProgram
 * @param input `~lib/array/Array<u8>`
 * @param registers `~lib/array/Array<u64>`
 * @param kind `i32`
 * @returns `assembly/api-generic/VmOutput`
 */
export declare function runProgram(input: Array<number>, registers: Array<bigint>, kind: number): __Record44<never>;
/**
 * assembly/api-generic/runVm
 * @param input `assembly/api-generic/VmInput`
 * @param logs `bool`
 * @param useSbrkGas `bool`
 * @returns `assembly/api-generic/VmOutput`
 */
export declare function runVm(input: __Record47<undefined>, logs?: boolean, useSbrkGas?: boolean): __Record44<never>;
/**
 * assembly/api-generic/getAssembly
 * @param p `assembly/program/Program`
 * @returns `~lib/string/String`
 */
export declare function getAssembly(p: __Internref30): string;
/**
 * assembly/program-build/wrapAsProgram
 * @param bytecode `~lib/typedarray/Uint8Array`
 * @returns `~lib/typedarray/Uint8Array`
 */
export declare function wrapAsProgram(bytecode: Uint8Array): Uint8Array;
/**
 * assembly/api/resetGeneric
 * @param program `~lib/array/Array<u8>`
 * @param flatRegisters `~lib/array/Array<u8>`
 * @param initialGas `i64`
 */
export declare function resetGeneric(program: Array<number>, flatRegisters: Array<number>, initialGas: bigint): void;
/**
 * assembly/api/resetGenericWithMemory
 * @param program `~lib/array/Array<u8>`
 * @param flatRegisters `~lib/array/Array<u8>`
 * @param pageMap `~lib/typedarray/Uint8Array`
 * @param chunks `~lib/typedarray/Uint8Array`
 * @param initialGas `i64`
 */
export declare function resetGenericWithMemory(program: Array<number>, flatRegisters: Array<number>, pageMap: Uint8Array, chunks: Uint8Array, initialGas: bigint): void;
/**
 * assembly/api/nextStep
 * @returns `bool`
 */
export declare function nextStep(): boolean;
/**
 * assembly/api/nSteps
 * @param steps `u32`
 * @returns `bool`
 */
export declare function nSteps(steps: number): boolean;
/**
 * assembly/api/getProgramCounter
 * @returns `u32`
 */
export declare function getProgramCounter(): number;
/**
 * assembly/api/setNextProgramCounter
 * @param pc `u32`
 */
export declare function setNextProgramCounter(pc: number): void;
/**
 * assembly/api/getStatus
 * @returns `u8`
 */
export declare function getStatus(): number;
/**
 * assembly/api/getExitArg
 * @returns `u32`
 */
export declare function getExitArg(): number;
/**
 * assembly/api/getGasLeft
 * @returns `i64`
 */
export declare function getGasLeft(): bigint;
/**
 * assembly/api/setGasLeft
 * @param gas `i64`
 */
export declare function setGasLeft(gas: bigint): void;
/**
 * assembly/api/getRegisters
 * @returns `~lib/typedarray/Uint8Array`
 */
export declare function getRegisters(): Uint8Array;
/**
 * assembly/api/setRegisters
 * @param flatRegisters `~lib/array/Array<u8>`
 */
export declare function setRegisters(flatRegisters: Array<number>): void;
/**
 * assembly/api/getPageDump
 * @param index `u32`
 * @returns `~lib/typedarray/Uint8Array`
 */
export declare function getPageDump(index: number): Uint8Array;
/**
 * assembly/api/setMemory
 * @param address `u32`
 * @param data `~lib/typedarray/Uint8Array`
 */
export declare function setMemory(address: number, data: Uint8Array): void;
/** assembly/api-generic/InitialChunk */
declare interface __Record45<TOmittable> {
  /** @type `u32` */
  address: number | TOmittable;
  /** @type `~lib/array/Array<u8>` */
  data: Array<number>;
}
/** assembly/api-generic/VmOutput */
declare interface __Record44<TOmittable> {
  /** @type `i32` */
  status: number | TOmittable;
  /** @type `~lib/array/Array<u64>` */
  registers: Array<bigint>;
  /** @type `u32` */
  pc: number | TOmittable;
  /** @type `~lib/array/Array<assembly/api-generic/InitialChunk>` */
  memory: Array<__Record45<never>>;
  /** @type `i64` */
  gas: bigint | TOmittable;
  /** @type `u32` */
  exitCode: number | TOmittable;
}
/** assembly/api-generic/InitialPage */
declare interface __Record48<TOmittable> {
  /** @type `u32` */
  address: number | TOmittable;
  /** @type `u32` */
  length: number | TOmittable;
  /** @type `i32` */
  access: number | TOmittable;
}
/** assembly/api-generic/VmInput */
declare interface __Record47<TOmittable> {
  /** @type `~lib/array/Array<u64>` */
  registers: Array<bigint>;
  /** @type `u32` */
  pc: number | TOmittable;
  /** @type `i64` */
  gas: bigint | TOmittable;
  /** @type `~lib/array/Array<u8>` */
  program: Array<number>;
  /** @type `~lib/array/Array<assembly/api-generic/InitialPage>` */
  pageMap: Array<__Record48<undefined>>;
  /** @type `~lib/array/Array<assembly/api-generic/InitialChunk>` */
  memory: Array<__Record45<undefined>>;
}
/** assembly/program/Program */
declare class __Internref30 extends Number {
  private __nominal30: symbol;
  private __nominal0: symbol;
}
