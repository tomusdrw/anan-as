/**
 * PVM-in-PVM Entry Point for WASM Compiler Target
 *
 * This module is the entry point for the `compiler` build target, which compiles
 * the anan-as PVM interpreter to PVM bytecode itself. This enables PVM-in-PVM
 * testing and execution, where the inner PVM program runs inside an interpreter
 * that is itself running on PVM.
 *
 * The compiled WASM module can be used to:
 * 1. Run SPI programs directly (for testing/conformance)
 * 2. Execute programs that make host calls, with the host environment
 *    handling those calls via the exported functions
 *
 * == Input Format (main) ==
 * [8:gas][4:pc][4:spi-program-len][4:inner-args-len][...spi-program][...inner-args]
 *
 * == Output Format ==
 * All functions return packed i64: lower 32 bits = pointer, upper 32 bits = length
 *
 * For HOST status (host call pending):
 *   [1:status][4:host_call_id]
 *
 * For HALT (successful completion):
 *   [1:status][4:exit_code][8:gas][4:pc][...result]
 *
 * For PANIC/FAULT/OOG (errors):
 *   [1:status][4:exit_code/fault_addr]
 */

import { HasMetadata, InputKind, prepareProgram } from "./api-utils";
import { Interpreter, Status } from "./interpreter";
import { MaybePageFault } from "./memory";

/** Pack a WASM pointer and length into a single i64 for the SPI result convention.
 * Lower 32 bits = pointer, upper 32 bits = length.
 */
function packResult(ptr: u32, len: u32): i64 {
  return (ptr as i64) | ((len as i64) << 32);
}

/** Size of the host state struct: pc(4) + pad(4) + gas(8) + regs(13*8) = 120 bytes */
const HOST_STATE_SIZE: u32 = 4 + 4 + 8 + 13 * 8;

/** Persistent interpreter instance for host call handling */
let interpreter: Interpreter | null = null;

/** Host state struct buffer (pc, gas, registers) */
let hostStatePtr: u32 = 0;

/** Allocate or get the host state buffer */
function getHostStateBuffer(): u32 {
  if (hostStatePtr === 0) {
    hostStatePtr = <u32>heap.alloc(HOST_STATE_SIZE);
  }
  return hostStatePtr;
}

/** Write current interpreter state to the host state buffer */
function writeHostState(): void {
  const int = interpreter;
  if (int === null) {
    return;
  }
  const ptr = hostStatePtr;
  let offset: u32 = 0;

  // pc (4 bytes)
  store<u32>(ptr + offset, int.pc);
  offset += 4;

  // padding (4 bytes)
  store<u32>(ptr + offset, 0);
  offset += 4;

  // gas (8 bytes)
  store<u64>(ptr + offset, int.gas.get());
  offset += 8;

  // registers (13 x 8 bytes)
  for (let i: u32 = 0; i < 13; i++) {
    store<u64>(ptr + offset, int.registers[i]);
    offset += 8;
  }
}

/** Read host state from the buffer and apply to interpreter */
function readHostState(statePtr: u32): void {
  const int = interpreter;
  if (int === null) {
    return;
  }
  let offset: u32 = 0;

  // pc (4 bytes)
  const pc = load<u32>(statePtr + offset);
  offset += 4;

  // skip padding (4 bytes)
  offset += 4;

  // gas (8 bytes)
  const gas = load<u64>(statePtr + offset);
  offset += 8;

  // Set gas
  int.gas.set(gas);

  // registers (13 x 8 bytes)
  for (let i: u32 = 0; i < 13; i++) {
    int.registers[i] = load<u64>(statePtr + offset);
    offset += 8;
  }

  // Set the next PC to resume from
  int.nextPc = pc;
}

/** Create output buffer and return packed result.
 * For HOST status: [status, exitCode] (5 bytes)
 * For other statuses: [status, exitCode, gas, pc, ...resultData]
 */
function createOutput(int: Interpreter, resultData: u8[] = []): i64 {
  const isHost = int.status === Status.HOST;
  const dataLen: u32 = <u32>resultData.length;
  const totalLen: u32 = isHost ? 5 : 1 + 4 + 8 + 4 + dataLen;
  const buf: u32 = <u32>heap.alloc(totalLen);

  // Status (1 byte)
  store<u8>(buf, int.status);

  // exitCode / host_call_id (4 bytes)
  store<u32>(buf + 1, int.exitCode);

  if (!isHost) {
    // Gas left (8 bytes)
    store<u64>(buf + 5, int.gas.get());
    // PC (4 bytes)
    store<u32>(buf + 13, int.pc);
    // Result data
    for (let i: u32 = 0; i < dataLen; i++) {
      store<u8>(buf + 17 + i, resultData[i]);
    }
  }

  return packResult(buf, totalLen);
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

/** Execute interpreter until it stops (host call, halt, or error) */
function runUntilStop(int: Interpreter): void {
  while (int.nextSteps(u32.MAX_VALUE)) {
    // nextSteps() handles HOST resuming and nextPc updates internally
    // so we just run as much as we can and then exit
  }
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
    // Invalid input - return error status
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
    // Invalid input - return error status
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

  // Ensure host state buffer is allocated
  getHostStateBuffer();

  // Run until we stop
  runUntilStop(int);

  // Handle result based on status
  if (int.status === Status.HOST) {
    // Write current state to host state buffer
    writeHostState();
    return createOutput(int);
  }

  // Final result
  const resultData = readResultData(int);
  const result = createOutput(int, resultData);

  // Clean up interpreter
  int.memory.free();
  interpreter = null;

  return result;
}

function setPanicResult(): i64 {
  const buf: u32 = <u32>heap.alloc(1);
  store<u8>(buf, Status.PANIC);
  return packResult(buf, 1);
}

/**
 * Get the current interpreter state.
 * Returns a pointer to a struct in interpreter memory:
 *   offset 0:  pc: u32
 *   offset 4:  _pad: u32
 *   offset 8:  gas: i64
 *   offset 16: regs: u64[13]  // 104 bytes
 * Total: 120 bytes
 *
 * The host can read and write this struct directly.
 * Only valid after main() returns HOST status.
 */
export function host_state(): u32 {
  return hostStatePtr;
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
    return 1; // Writing 0 bytes always succeeds
  }
  const int = interpreter;
  if (int === null) {
    return 0; // No interpreter available
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

/**
 * Resume execution after host call.
 * @param statePtr Pointer to state struct (same format as host_state())
 * @returns Packed i64: lower 32 bits = result pointer, upper 32 bits = result length
 *          Same format as main() - either HOST status or final result.
 */
export function host_resume(statePtr: u32): i64 {
  const int = interpreter;
  if (int === null) {
    return setPanicResult();
  }

  // Read new state from the provided pointer
  readHostState(statePtr);

  // Run until we stop again
  runUntilStop(int);

  // Handle result based on status
  if (int.status === Status.HOST) {
    // Write current state to host state buffer
    writeHostState();
    return createOutput(int);
  }

  // Final result
  const resultData = readResultData(int);
  const result = createOutput(int, resultData);

  // Clean up interpreter
  int.memory.free();
  interpreter = null;

  return result;
}
