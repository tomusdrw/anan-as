/**
 * PVM-in-PVM Entry Point for WASM Compiler Target
 *
 * This module is the entry point for the `compiler` build target, which compiles
 * the anan-as PVM interpreter to PVM bytecode itself. This enables PVM-in-PVM
 * testing and execution, where the inner PVM program runs inside an interpreter
 * that is itself running on PVM.
 *
 * == Host Call Handling ==
 * When the inner program executes an `ecalli` instruction, this module calls the
 * imported `host_call_6b(ecalli, r7..r12) -> r7` and `host_call_r8() -> r8`
 * functions. The import adapter is responsible for:
 *   - Determining which registers contain pointers for each ecalli
 *   - Translating inner PVM addresses using `host_read_memory` / `host_write_memory`
 *   - Implementing the actual host call logic
 *
 * The `host_read_memory` and `host_write_memory` exports are only valid to call
 * from within `host_call_6b` (i.e. while the interpreter is paused on a host call).
 *
 * == Input Format (main) ==
 * [8:gas][4:pc][4:spi-program-len][4:inner-args-len][...spi-program][...inner-args]
 *
 * == Output Format ==
 * All functions return packed i64: lower 32 bits = pointer, upper 32 bits = length
 *
 * For HALT (successful completion):
 *   [1:status][4:exit_code][8:gas][4:pc][...result]
 *
 * For PANIC/FAULT/OOG (errors):
 *   [1:status][4:exit_code]
 */

import { HasMetadata, InputKind, prepareProgram } from "./api-utils";
import { host_call_6b, host_call_r8 } from "./env";
import { Interpreter, Status } from "./interpreter";
import { MaybePageFault } from "./memory";

/** Pack a WASM pointer and length into a single i64 for the SPI result convention.
 * Lower 32 bits = pointer, upper 32 bits = length.
 */
function packResult(ptr: u32, len: u32): i64 {
  return (ptr as i64) | ((len as i64) << 32);
}

/** Persistent interpreter instance (accessible by host_read_memory / host_write_memory) */
let interpreter: Interpreter | null = null;

function setPanicResult(): i64 {
  const buf: u32 = <u32>heap.alloc(5);
  store<u8>(buf, Status.PANIC);
  store<u32>(buf + 1, 0);
  return packResult(buf, 5);
}

/** Read the result data from a halted interpreter */
function readResultData(int: Interpreter): u8[] {
  if (int.status !== Status.HALT) {
    return [];
  }

  // JAM return convention
  const ptr_start = u32(int.registers[7] & u64(0xffff_ffff));
  const ptr_end = u32(int.registers[8] & u64(0xffff_ffff));

  // invalid output result
  if (ptr_start >= ptr_end) {
    return [];
  }

  // attempt to read the output memory (up to 1MB)
  const totalLength = ptr_end - ptr_start;
  if (totalLength > 1_024 * 1_024) {
    return [];
  }

  const result = new Uint8Array(totalLength);
  const faultRes = new MaybePageFault();
  int.memory.bytesRead(faultRes, ptr_start, result, 0);

  if (faultRes.isFault) {
    return [];
  }

  // copy the Uint8Array to a regular array
  const out = new Array<u8>(totalLength);
  for (let i: u32 = 0; i < totalLength; i++) {
    out[i] = result[i];
  }
  return out;
}

/**
 * Main entry point following wasm-pvm convention.
 * @param argsPtr Pointer to input arguments (PVM address 0xFEFF0000)
 * @param argsLen Length of arguments in bytes
 * @returns Packed i64: lower 32 bits = result pointer, upper 32 bits = result length
 */
export function main(argsPtr: u32, argsLen: u32): i64 {
  // 8 (gas) + 4 (pc) + 4 (spi-program-len) + 4 (inner-args-len) + ? (spi-program) + ? (inner-args) = 20 + ? bytes
  if (argsLen < 20) {
    return setPanicResult();
  }

  let offset: u32 = 0;
  // Read gas (8 bytes, little-endian u64)
  const gas = load<u64>(argsPtr + offset);
  offset += 8;

  // Read pc (4 bytes, little-endian u32)
  const pc = load<u32>(argsPtr + offset);
  offset += 4;

  // Read program_len (4 bytes, little-endian u32)
  const programLen = load<u32>(argsPtr + offset);
  offset += 4;

  // Read args_len (4 bytes, little-endian u32)
  const innerArgsLen = load<u32>(argsPtr + offset);
  offset += 4;

  // we don't have enough data - prevent u32 overflow by casting to u64
  if (u64(argsLen) - u64(offset) !== u64(programLen) + u64(innerArgsLen)) {
    return setPanicResult();
  }

  // Read program code
  const spiProgram: u8[] = [];
  for (let i: u32 = 0; i < programLen; i++) {
    spiProgram.push(load<u8>(argsPtr + offset + i));
  }
  offset += programLen;

  // Read inner program args (remaining bytes)
  const innerArgs: u8[] = [];
  for (let i: u32 = 0; i < innerArgsLen; i++) {
    innerArgs.push(load<u8>(argsPtr + offset + i));
  }
  offset += innerArgsLen;

  // Parse SPI program and prepare memory layout
  const preallocateMemoryPages: u32 = 0;
  const useBlockGas = true;
  const program = prepareProgram(
    InputKind.SPI,
    HasMetadata.Yes,
    spiProgram,
    [],
    [],
    [],
    innerArgs,
    preallocateMemoryPages,
    useBlockGas,
  );

  // Create interpreter
  const int = new Interpreter(program.program, program.registers, program.memory);
  interpreter = int;
  int.gas.set(gas);
  int.nextPc = pc;

  // Run until terminal status, handling host calls along the way
  while (true) {
    // Execute until the interpreter stops
    while (int.nextSteps(u32.MAX_VALUE)) {}

    if (int.status !== Status.HOST) {
      // Terminal status: HALT, PANIC, FAULT, or OOG
      break;
    }

    // Handle host call: pass ecalli index + r7-r12 to the imported host_call_6b
    const ecalli = i64(int.exitCode);
    const r7 = host_call_6b(
      ecalli,
      int.registers[7],
      int.registers[8],
      int.registers[9],
      int.registers[10],
      int.registers[11],
      int.registers[12],
    );
    const r8 = host_call_r8();

    // Write results back to registers
    int.registers[7] = r7;
    int.registers[8] = r8;
    // Resume: nextPc was already set by the interpreter when it hit HOST status
  }

  // Build output
  const resultData = readResultData(int);
  const status = int.status;
  const isShort = status === Status.PANIC || status === Status.FAULT || status === Status.OOG;
  const dataLen: u32 = <u32>resultData.length;
  const totalLen: u32 = isShort ? 5 : 1 + 4 + 8 + 4 + dataLen;
  const buf: u32 = <u32>heap.alloc(totalLen);

  // Status (1 byte)
  store<u8>(buf, status);

  // exitCode (4 bytes)
  store<u32>(buf + 1, int.exitCode);

  if (!isShort) {
    // Gas left (8 bytes)
    store<u64>(buf + 5, int.gas.get());
    // PC (4 bytes)
    store<u32>(buf + 13, int.pc);
    // Result data
    for (let i: u32 = 0; i < dataLen; i++) {
      store<u8>(buf + 17 + i, resultData[i]);
    }
  }

  // Clean up
  int.memory.free();
  interpreter = null;

  return packResult(buf, totalLen);
}

/**
 * Read from inner PVM program memory.
 * @param addr Address in inner program's memory space
 * @param len Number of bytes to read
 * @returns Packed i64: lower 32 bits = pointer, upper 32 bits = length
 *          Buffer contains the data. Returns len=0 on page fault.
 */
export function host_read_memory(addr: u32, len: u32): i64 {
  const int = interpreter;
  if (int === null || len === 0) {
    return packResult(0, 0);
  }

  const result = new Uint8Array(len);
  const faultRes = new MaybePageFault();
  int.memory.bytesRead(faultRes, addr, result, 0);

  if (faultRes.isFault) {
    return packResult(0, 0);
  }

  // Allocate buffer and copy data
  const buf = <u32>heap.alloc(len);
  for (let i: u32 = 0; i < len; i++) {
    store<u8>(buf + i, result[i]);
  }

  return packResult(buf, len);
}

/**
 * Write to inner PVM program memory.
 * @param addr Address in inner program's memory space
 * @param dataPtr Pointer to data in interpreter/WASM memory
 * @param dataLen Number of bytes to write
 * @returns 1 on success, 0 on page fault
 */
export function host_write_memory(addr: u32, dataPtr: u32, dataLen: u32): u32 {
  if (dataLen === 0) {
    return 1;
  }
  const int = interpreter;
  if (int === null) {
    return 0;
  }

  // Read data from interpreter memory
  const data = new Uint8Array(dataLen);
  for (let i: u32 = 0; i < dataLen; i++) {
    data[i] = load<u8>(dataPtr + i);
  }

  const faultRes = new MaybePageFault();
  int.memory.bytesWrite(faultRes, addr, data, 0);

  return faultRes.isFault ? 0 : 1;
}
