import { buildMemory, getAssembly, vmDestroy, vmExecute, vmInit, vmRunOnce } from "./api-internal";
import { InitialChunk, InitialPage, VmInput, VmOutput, VmPause, VmRunOptions } from "./api-types";
import { Gas } from "./gas";
import { BlockGasCost, computeGasCosts } from "./gas-costs";
import { Interpreter } from "./interpreter";
import { MaybePageFault, MemoryBuilder } from "./memory";
import { portable } from "./portable";
import { deblob, extractCodeAndMetadata, liftBytes } from "./program";
import { NO_OF_REGISTERS, newRegisters, Registers } from "./registers";
import { decodeSpi, StandardProgram } from "./spi";

export enum InputKind {
  Generic = 0,
  SPI = 1,
}

export enum HasMetadata {
  Yes = 0,
  No = 1,
}

export function getGasCosts(input: u8[], kind: InputKind, withMetadata: HasMetadata): BlockGasCost[] {
  const program = prepareProgram(kind, withMetadata, input, [], [], [], [], 0);

  // @ts-ignore: AS returns T[], JS returns iterator - asArray handles both
  return portable.asArray<BlockGasCost>(computeGasCosts(program.program).values());
}

export function disassemble(input: u8[], kind: InputKind, withMetadata: HasMetadata): string {
  const program = prepareProgram(kind, withMetadata, input, [], [], [], [], 0);

  let output = "";
  if (withMetadata === HasMetadata.Yes) {
    output = "Metadata: \n";
    output += "0x";
    output += program.metadata.reduce((acc, x) => acc + x.toString(16).padStart(2, "0"), "");
    output += "\n\n";
  }

  output += getAssembly(program.program);

  return output;
}

export function prepareProgram(
  kind: InputKind,
  hasMetadata: HasMetadata,
  program: u8[],
  /** NOTE: ignored in case of SPI. */
  initialRegisters: u64[],
  /** NOTE: ignored in case of SPI. */
  initialPageMap: InitialPage[],
  /** NOTE: ignored in case of SPI. */
  initialMemory: InitialChunk[],
  /** NOTE: ONLY needed for SPI. */
  args: u8[],
  /** Preallocate a bunch of memory pages for faster execution. */
  preallocateMemoryPages: u32,
): StandardProgram {
  let code = liftBytes(program);
  let metadata = new Uint8Array(0);

  if (hasMetadata === HasMetadata.Yes) {
    const data = extractCodeAndMetadata(code);
    // @ts-ignore: TS 5.9 Uint8Array generic parameter mismatch
    code = data.code;
    // @ts-ignore: TS 5.9 Uint8Array generic parameter mismatch
    metadata = data.metadata;
  }

  if (kind === InputKind.Generic) {
    const program = deblob(code);

    const builder = new MemoryBuilder(preallocateMemoryPages);
    const memory = buildMemory(builder, initialPageMap, initialMemory);

    const registers: Registers = newRegisters();
    const safeLen = initialRegisters.length < NO_OF_REGISTERS ? initialRegisters.length : NO_OF_REGISTERS;
    for (let r = 0; r < safeLen; r++) {
      registers[r] = initialRegisters[r];
    }

    const exe: StandardProgram = new StandardProgram(program, memory, registers);
    exe.metadata = metadata;

    return exe;
  }

  if (kind === InputKind.SPI) {
    const exe = decodeSpi(code, liftBytes(args), preallocateMemoryPages);
    exe.metadata = metadata;
    return exe;
  }

  throw new Error(`Unknown kind: ${kind}`);
}

/** Execute PVM program and stop. */
export function runProgram(
  program: StandardProgram,
  initialGas: i64 = 0,
  programCounter: u32 = 0,
  logs: boolean = false,
  useSbrkGas: boolean = false,
  dumpMemory: boolean = false,
  useBlockGas: boolean = false,
): VmOutput {
  const vmInput = new VmInput(program.program, program.memory, program.registers);
  vmInput.gas = i64(initialGas);
  vmInput.pc = programCounter;

  const vmOptions = new VmRunOptions();
  vmOptions.logs = logs;
  vmOptions.useSbrkGas = useSbrkGas;
  vmOptions.useBlockGas = useBlockGas;
  vmOptions.dumpMemory = dumpMemory;

  return vmRunOnce(vmInput, vmOptions);
}

/** Next available pvm id. */
let nextPvmId: u32 = 0;
/** Currently allocated pvms. */
const pvms = new Map<u32, Interpreter>();

/**
 * Allocate new PVM instance to execute given program.
 *
 * NOTE: the PVM MUST be de-allocated using `pvmDestroy`.
 */
export function pvmStart(program: StandardProgram, useSbrkGas: boolean = false, useBlockGas: boolean = false): u32 {
  const vmInput = new VmInput(program.program, program.memory, program.registers);

  nextPvmId += 1;
  pvms.set(nextPvmId, vmInit(vmInput, useSbrkGas, useBlockGas));
  return nextPvmId;
}

/** Deallocate PVM resources. */
export function pvmDestroy(pvmId: u32): VmOutput | null {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    pvms.delete(pvmId);
    return vmDestroy(int, false);
  }
  return null;
}

/** Set register values of a paused PVM. */
export function pvmSetRegisters(pvmId: u32, registers: u64[]): void {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    const safeIter = registers.length < NO_OF_REGISTERS ? registers.length : NO_OF_REGISTERS;
    for (let i = 0; i < safeIter; i++) {
      int.registers[i] = registers[i];
    }
  }
}

/**
 * Read a continuous chunk of memory from given PVM instance.
 *
 * @deprecated Use `pvmGetPagePointer` instead to read memory directly from WASM linear memory
 * on the JS side with no additional WASM-side allocations.
 */
export function pvmReadMemory(pvmId: u32, address: u32, length: u32): Uint8Array | null {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    const faultRes = new MaybePageFault();
    const result = int.memory.getMemory(faultRes, address, length);
    if (!faultRes.isFault) {
      return result;
    }
  }
  return null;
}

/**
 * Returns the WASM linear memory pointer (byte offset) for the backing buffer of the page at `page`
 * in the given PVM instance.
 *
 * Returns `0` if the PVM does not exist, the page does not exist, or the page is not readable.
 *
 * Use this instead of `pvmReadMemory` to read memory efficiently from the JS side:
 * ```ts
 * let pagesRead = 0;
 * for (let address = start; address < end; address += PAGE_SIZE) {
 *   const page = address >> PAGE_SIZE_SHIFT;
 *   const ptr = pvmGetPagePointer(pvmId, page);
 *   if (ptr === 0) {
 *     throw new Error(`Page fault at ${page << PAGE_SIZE_SHIFT}`);
 *   }
 *   destination.set(
 *     new Uint8Array(wasm.instance.exports.memory.buffer, ptr, Math.min(end - address, PAGE_SIZE)),
 *     pagesRead << PAGE_SIZE_SHIFT,
 *   );
 *   pagesRead += 1;
 * }
 * ```
 */
export function pvmGetPagePointer(pvmId: u32, page: u32): usize {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    return int.memory.getPagePointer(page);
  }
  return 0;
}

/** Write a chunk of memory to given PVM instance. */
export function pvmWriteMemory(pvmId: u32, address: u32, data: Uint8Array): boolean {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    const faultRes = new MaybePageFault();

    // Preflight: verify the entire target range is accessible before writing
    const tempBuffer = new Uint8Array(data.length);
    int.memory.bytesRead(faultRes, address, tempBuffer, 0);
    if (faultRes.isFault) {
      return false;
    }

    // Now perform the actual write
    faultRes.isFault = false;
    faultRes.isAccess = false;
    int.memory.bytesWrite(faultRes, address, data, 0);
    if (!faultRes.isFault) {
      return true;
    }
  }
  return false;
}

/** Resume execution of paused VM. */
export function pvmResume(pvmId: u32, gas: Gas, pc: u32, logs: boolean = false): VmPause | null {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    int.nextPc = pc;
    int.gas.set(gas);
    vmExecute(int, logs);

    const pause = new VmPause();
    pause.status = int.status;
    pause.exitCode = int.exitCode;
    pause.pc = int.pc;
    pause.nextPc = int.nextPc;
    pause.gas = int.gas.get();
    pause.registers = int.registers.slice(0);

    return pause;
  }

  return null;
}
