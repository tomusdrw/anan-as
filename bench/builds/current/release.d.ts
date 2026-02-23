/** Exported memory */
export declare const memory: WebAssembly.Memory;
/**
 * assembly/api-internal/getAssembly
 * @param p `assembly/program/Program`
 * @returns `~lib/string/String`
 */
export declare function getAssembly(p: __Internref27): string;
/**
 * assembly/program-build/wrapAsProgram
 * @param bytecode `~lib/typedarray/Uint8Array`
 * @returns `~lib/typedarray/Uint8Array`
 */
export declare function wrapAsProgram(bytecode: Uint8Array): Uint8Array;
/**
 * assembly/api-debugger/resetJAM
 * @param program `~lib/array/Array<u8>`
 * @param pc `u32`
 * @param initialGas `i64`
 * @param args `~lib/array/Array<u8>`
 * @param hasMetadata `bool`
 */
export declare function resetJAM(program: Array<number>, pc: number, initialGas: bigint, args: Array<number>, hasMetadata?: boolean): void;
/**
 * assembly/api-debugger/resetGeneric
 * @param program `~lib/array/Array<u8>`
 * @param flatRegisters `~lib/array/Array<u8>`
 * @param initialGas `i64`
 * @param hasMetadata `bool`
 */
export declare function resetGeneric(program: Array<number>, flatRegisters: Array<number>, initialGas: bigint, hasMetadata?: boolean): void;
/**
 * assembly/api-debugger/resetGenericWithMemory
 * @param program `~lib/array/Array<u8>`
 * @param flatRegisters `~lib/array/Array<u8>`
 * @param pageMap `~lib/typedarray/Uint8Array`
 * @param chunks `~lib/typedarray/Uint8Array`
 * @param initialGas `i64`
 * @param hasMetadata `bool`
 */
export declare function resetGenericWithMemory(program: Array<number>, flatRegisters: Array<number>, pageMap: Uint8Array, chunks: Uint8Array, initialGas: bigint, hasMetadata?: boolean): void;
/**
 * assembly/api-debugger/nextStep
 * @returns `bool`
 */
export declare function nextStep(): boolean;
/**
 * assembly/api-debugger/nSteps
 * @param steps `u32`
 * @returns `bool`
 */
export declare function nSteps(steps: number): boolean;
/**
 * assembly/api-debugger/getProgramCounter
 * @returns `u32`
 */
export declare function getProgramCounter(): number;
/**
 * assembly/api-debugger/setNextProgramCounter
 * @param pc `u32`
 */
export declare function setNextProgramCounter(pc: number): void;
/**
 * assembly/api-debugger/getStatus
 * @returns `u8`
 */
export declare function getStatus(): number;
/**
 * assembly/api-debugger/getExitArg
 * @returns `u32`
 */
export declare function getExitArg(): number;
/**
 * assembly/api-debugger/getGasLeft
 * @returns `i64`
 */
export declare function getGasLeft(): bigint;
/**
 * assembly/api-debugger/setGasLeft
 * @param gas `i64`
 */
export declare function setGasLeft(gas: bigint): void;
/**
 * assembly/api-debugger/getRegisters
 * @returns `~lib/typedarray/Uint8Array`
 */
export declare function getRegisters(): Uint8Array;
/**
 * assembly/api-debugger/setRegisters
 * @param flatRegisters `~lib/array/Array<u8>`
 */
export declare function setRegisters(flatRegisters: Array<number>): void;
/**
 * assembly/api-debugger/getPageDump
 * @param index `u32`
 * @returns `~lib/typedarray/Uint8Array`
 */
export declare function getPageDump(index: number): Uint8Array;
/**
 * assembly/api-debugger/getPagePointer
 * @param page `u32`
 * @returns `usize`
 */
export declare function getPagePointer(page: number): number;
/**
 * assembly/api-debugger/getMemory
 * @param address `u32`
 * @param length `u32`
 * @returns `~lib/typedarray/Uint8Array | null`
 */
export declare function getMemory(address: number, length: number): Uint8Array | null;
/**
 * assembly/api-debugger/setMemory
 * @param address `u32`
 * @param data `~lib/typedarray/Uint8Array`
 * @returns `bool`
 */
export declare function setMemory(address: number, data: Uint8Array): boolean;
/** assembly/api-utils/InputKind */
export declare enum InputKind {
  /** @type `i32` */
  Generic,
  /** @type `i32` */
  SPI,
}
/** assembly/api-utils/HasMetadata */
export declare enum HasMetadata {
  /** @type `i32` */
  Yes,
  /** @type `i32` */
  No,
}
/**
 * assembly/api-utils/getGasCosts
 * @param input `~lib/array/Array<u8>`
 * @param kind `i32`
 * @param withMetadata `i32`
 * @returns `~lib/array/Array<assembly/gas-costs/BlockGasCost>`
 */
export declare function getGasCosts(input: Array<number>, kind: number, withMetadata: number): Array<__Record52<never>>;
/**
 * assembly/api-utils/disassemble
 * @param input `~lib/array/Array<u8>`
 * @param kind `i32`
 * @param withMetadata `i32`
 * @returns `~lib/string/String`
 */
export declare function disassemble(input: Array<number>, kind: number, withMetadata: number): string;
/**
 * assembly/api-utils/prepareProgram
 * @param kind `i32`
 * @param hasMetadata `i32`
 * @param program `~lib/array/Array<u8>`
 * @param initialRegisters `~lib/array/Array<u64>`
 * @param initialPageMap `~lib/array/Array<assembly/api-types/InitialPage>`
 * @param initialMemory `~lib/array/Array<assembly/api-types/InitialChunk>`
 * @param args `~lib/array/Array<u8>`
 * @param preallocateMemoryPages `u32`
 * @returns `assembly/spi/StandardProgram`
 */
export declare function prepareProgram(kind: number, hasMetadata: number, program: Array<number>, initialRegisters: Array<bigint>, initialPageMap: Array<__Record48<undefined>>, initialMemory: Array<__Record50<undefined>>, args: Array<number>, preallocateMemoryPages: number): __Internref44;
/**
 * assembly/api-utils/runProgram
 * @param program `assembly/spi/StandardProgram`
 * @param initialGas `i64`
 * @param programCounter `u32`
 * @param logs `bool`
 * @param useSbrkGas `bool`
 * @param dumpMemory `bool`
 * @returns `assembly/api-types/VmOutput`
 */
export declare function runProgram(program: __Internref44, initialGas?: bigint, programCounter?: number, logs?: boolean, useSbrkGas?: boolean, dumpMemory?: boolean): __Record57<never>;
/**
 * assembly/api-utils/pvmStart
 * @param program `assembly/spi/StandardProgram`
 * @param useSbrkGas `bool`
 * @returns `u32`
 */
export declare function pvmStart(program: __Internref44, useSbrkGas?: boolean): number;
/**
 * assembly/api-utils/pvmDestroy
 * @param pvmId `u32`
 * @returns `assembly/api-types/VmOutput | null`
 */
export declare function pvmDestroy(pvmId: number): __Record57<never> | null;
/**
 * assembly/api-utils/pvmSetRegisters
 * @param pvmId `u32`
 * @param registers `~lib/array/Array<u64>`
 */
export declare function pvmSetRegisters(pvmId: number, registers: Array<bigint>): void;
/**
 * assembly/api-utils/pvmReadMemory
 * @param pvmId `u32`
 * @param address `u32`
 * @param length `u32`
 * @returns `~lib/typedarray/Uint8Array | null`
 */
export declare function pvmReadMemory(pvmId: number, address: number, length: number): Uint8Array | null;
/**
 * assembly/api-utils/pvmGetPagePointer
 * @param pvmId `u32`
 * @param page `u32`
 * @returns `usize`
 */
export declare function pvmGetPagePointer(pvmId: number, page: number): number;
/**
 * assembly/api-utils/pvmWriteMemory
 * @param pvmId `u32`
 * @param address `u32`
 * @param data `~lib/typedarray/Uint8Array`
 * @returns `bool`
 */
export declare function pvmWriteMemory(pvmId: number, address: number, data: Uint8Array): boolean;
/**
 * assembly/api-utils/pvmResume
 * @param pvmId `u32`
 * @param gas `i64`
 * @param pc `u32`
 * @param logs `bool`
 * @returns `assembly/api-types/VmPause | null`
 */
export declare function pvmResume(pvmId: number, gas: bigint, pc: number, logs?: boolean): __Record63<never> | null;
/** assembly/program/Program */
declare class __Internref27 extends Number {
  private __nominal27: symbol;
  private __nominal0: symbol;
}
/** assembly/gas-costs/BlockGasCost */
declare interface __Record52<TOmittable> {
  /** @type `u32` */
  pc: number | TOmittable;
  /** @type `u64` */
  gas: bigint | TOmittable;
}
/** assembly/api-types/InitialPage */
declare interface __Record48<TOmittable> {
  /** @type `u32` */
  address: number | TOmittable;
  /** @type `u32` */
  length: number | TOmittable;
  /** @type `i32` */
  access: number | TOmittable;
}
/** assembly/api-types/InitialChunk */
declare interface __Record50<TOmittable> {
  /** @type `u32` */
  address: number | TOmittable;
  /** @type `~lib/array/Array<u8>` */
  data: Array<number>;
}
/** assembly/spi/StandardProgram */
declare class __Internref44 extends Number {
  private __nominal44: symbol;
  private __nominal0: symbol;
}
/** assembly/api-types/VmOutput */
declare interface __Record57<TOmittable> {
  /** @type `i32` */
  status: number | TOmittable;
  /** @type `u32` */
  exitCode: number | TOmittable;
  /** @type `u32` */
  pc: number | TOmittable;
  /** @type `i64` */
  gas: bigint | TOmittable;
  /** @type `~lib/array/Array<u8>` */
  result: Array<number>;
  /** @type `~lib/array/Array<u64>` */
  registers: Array<bigint>;
  /** @type `~lib/array/Array<assembly/api-types/InitialChunk>` */
  memory: Array<__Record50<never>>;
}
/** assembly/api-types/VmPause */
declare interface __Record63<TOmittable> {
  /** @type `i32` */
  status: number | TOmittable;
  /** @type `u32` */
  exitCode: number | TOmittable;
  /** @type `u32` */
  pc: number | TOmittable;
  /** @type `u32` */
  nextPc: number | TOmittable;
  /** @type `i64` */
  gas: bigint | TOmittable;
  /** @type `~lib/array/Array<u64>` */
  registers: Array<bigint>;
}
