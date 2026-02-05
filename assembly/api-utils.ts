import { buildMemory, getAssembly, vmDestroy, vmExecute, vmInit, vmRunOnce } from "./api-internal";
import { InitialChunk, InitialPage, VmInput, VmOutput, VmPause } from "./api-types";
import { BlockGasCost, computeGasCosts } from "./gas-costs";
import { Interpreter } from "./interpreter";
import { MaybePageFault, MemoryBuilder } from "./memory";
import { deblob, extractCodeAndMetadata, liftBytes } from "./program";
import { NO_OF_REGISTERS, Registers } from "./registers";
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
  const program = prepareProgram(kind, withMetadata, input, [], [], [], []);

  return computeGasCosts(program.program).values();
}

export function disassemble(input: u8[], kind: InputKind, withMetadata: HasMetadata): string {
  const program = prepareProgram(kind, withMetadata, input, [], [], [], []);

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
): StandardProgram {
  let code = liftBytes(program);
  let metadata = new Uint8Array(0);

  if (hasMetadata === HasMetadata.Yes) {
    const data = extractCodeAndMetadata(code);
    code = data.code;
    metadata = data.metadata;
  }

  if (kind === InputKind.Generic) {
    const program = deblob(code);

    const builder = new MemoryBuilder();
    const memory = buildMemory(builder, initialPageMap, initialMemory);

    const registers: Registers = new StaticArray(NO_OF_REGISTERS);
    for (let r = 0; r < initialRegisters.length; r++) {
      registers[r] = initialRegisters[r];
    }

    const exe: StandardProgram = new StandardProgram(program, memory, registers);
    exe.metadata = metadata;

    return exe;
  }

  if (kind === InputKind.SPI) {
    const exe = decodeSpi(code, liftBytes(args));
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
): VmOutput {
  const vmInput = new VmInput(program.program, program.memory, program.registers);
  vmInput.gas = initialGas;
  vmInput.pc = programCounter;

  return vmRunOnce(vmInput, logs, useSbrkGas);
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
export function pvmStart(program: StandardProgram, useSbrkGas: boolean = false): u32 {
  const vmInput = new VmInput(program.program, program.memory, program.registers);

  nextPvmId += 1;
  pvms.set(nextPvmId, vmInit(vmInput, useSbrkGas));
  return nextPvmId;
}

/** Deallocate PVM resources. */
export function pvmDestroy(pvmId: u32): VmOutput | null {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId)!;
    pvms.delete(pvmId);
    return vmDestroy(int, false);
  }
  return null;
}

/** Set register values of a paused PVM. */
export function pvmSetRegisters(pvmId: u32, registers: u64[]): void {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId)!;
    const safeIter = registers.length < NO_OF_REGISTERS ? registers.length : NO_OF_REGISTERS;
    for (let i = 0; i < safeIter; i++) {
      int.registers[i] = registers[i];
    }
  }
}

/**
 * Read a continuous chunk of memory from given PVM instance.
 *
 * @deprecated see getMemory for details
 */
export function pvmReadMemory(pvmId: u32, address: u32, length: u32): Uint8Array | null {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId)!;
    const faultRes = new MaybePageFault();
    const result = int.memory.getMemory(faultRes, address, length);
    if (!faultRes.isFault) {
      return result;
    }
  }
  return null;
}

/** Write a chunk of memory to given PVM instance. */
export function pvmWriteMemory(pvmId: u32, address: u32, data: Uint8Array): boolean {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId)!;
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
export function pvmResume(pvmId: u32, gas: i64, pc: u32, logs: boolean = false): VmPause | null {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId)!;
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
