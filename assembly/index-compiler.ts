/**
 * PVM-in-PVM Main Entry Point
 *
 * This module provides a main() function that follows the SPI entrypoint convention,
 * allowing anan-as to be compiled to PVM and run as a standalone interpreter.
 *
 * Input:
 * 8 (gas)
 * 4 (pc)
 * 4 (spi-program-len)
 * 4 (inner-args-len)
 * ? (spi-program)
 * ? (inner-args)
 *
 * Output:
 * 1 (status)
 * 4 (exitCode)
 * 8 (gas)
 * 4 (pc)
 * ? (result)
 */

import { HasMetadata, InputKind, prepareProgram, runProgram } from "./api-utils";
import { Status } from "./interpreter";

// Globals for result pointer and length (SPI convention)
// These must be mutable globals that the compiler can read
export let result_ptr: u32 = 0;
export let result_len: u32 = 0;

/**
 * Main entry point following SPI convention.
 * @param argsPtr Pointer to input arguments (PVM address 0xFEFF0000)
 * @param argsLen Length of arguments in bytes
 */
export function main(argsPtr: u32, argsLen: u32): void {
  // 8 (gas) + 4 (pc) + 4 (spi-program-len) + 4 (inner-args-len) + ? (spi-program) + ? (inner-args) = 20 + ? bytes
  if (argsLen < 20) {
    // Invalid input - return error status
    setPanicResult();
    return;
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
    setPanicResult();
    return;
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
  const program = prepareProgram(
    InputKind.SPI,
    HasMetadata.Yes,
    spiProgram,
    [],
    [],
    [],
    innerArgs,
    preallocateMemoryPages,
  );

  // Run the program
  const result = runProgram(program, gas, pc, false, false);

  // Calculate exact result size: 1 (status) + 4 (exitCode) + 8 (gas) + 4 (pc) + ? (result data)
  const dataLen: u32 = <u32>result.result.length;
  const totalLen: u32 = 1 + 4 + 8 + 4 + dataLen;
  const buf: u32 = <u32>heap.alloc(totalLen);

  let pos: u32 = 0;

  // Status (1 byte)
  store<u8>(buf + pos, result.status);
  pos += 1;

  // exitCode (4 bytes)
  store<u32>(buf + pos, result.exitCode);
  pos += 4;

  // Gas left (8 bytes)
  store<u64>(buf + pos, result.gas);
  pos += 8;

  // PC (4 bytes)
  store<u32>(buf + pos, result.pc);
  pos += 4;

  // Result data
  for (let i: u32 = 0; i < dataLen; i++) {
    store<u8>(buf + pos + i, result.result[i]);
  }

  // Set result pointer and length
  result_ptr = buf;
  result_len = totalLen;
}

function setPanicResult(): void {
  const buf: u32 = <u32>heap.alloc(1);
  store<u8>(buf, Status.PANIC);
  result_ptr = buf;
  result_len = 1;
}
