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

import { runJAM } from "./api-utils";

// Result buffer location (in WASM linear memory)
const RESULT_BUFFER: u32 = 0x100; // After globals area

// Globals for result pointer and length (SPI convention)
// These must be mutable globals that the compiler can read
export let result_ptr: u32 = 0;
export let result_len: u32 = 0;

/**
 * Main entry point following SPI convention.
 * @param argsPtr Pointer to input arguments (PVM address 0xFEFF0000)
 * @param argsLen Length of arguments in bytes
 */
export function pvmMain(argsPtr: u32, argsLen: u32): void {
  // 8 (gas) + 4 (pc) + 4 (spi-program-len) + 4 (inner-args-len) + ? (spi-program) + ? (inner-args) = 20 + ? bytes
  if (argsLen < 20) {
    // Invalid input - return error status
    store<u8>(RESULT_BUFFER, 1); // PANIC status
    result_ptr = RESULT_BUFFER;
    result_len = 1;
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

  // we don't have enough data
  if (argsLen - offset !== programLen + innerArgsLen) {
    // Invalid input - return error status
    store<u8>(RESULT_BUFFER, 1); // PANIC status
    result_ptr = RESULT_BUFFER;
    result_len = 1;
    return;
  }

  // Read program code
  const spiProgram: u8[] = [];
  for (let i: u32 = offset; i < programLen; i++) {
    spiProgram.push(load<u8>(argsPtr + i));
  }
  offset += programLen;

  // Read inner program args (remaining bytes)
  const innerArgs: u8[] = [];
  for (let i: u32 = offset; i < innerArgsLen; i++) {
    innerArgs.push(load<u8>(argsPtr + i));
  }
  offset += innerArgsLen;

  // Execute the program
  const result = runJAM(pc, gas, spiProgram, innerArgs, false, false);

  // Write output to result buffer
  let outOffset: u32 = 0;

  // Status (1 byte)
  store<u8>(RESULT_BUFFER + outOffset, result.status);
  outOffset += 1;

  // exitCode (4 bytes)
  store<u32>(RESULT_BUFFER + outOffset, result.exitCode);
  outOffset += 4;

  // Gas left (8 bytes)
  store<u64>(RESULT_BUFFER + outOffset, result.gas);
  outOffset += 8;

  // PC (4 bytes)
  store<u32>(RESULT_BUFFER + outOffset, result.pc);
  outOffset += 4;

  // Result
  const resultLen = result.result.length;
  for (let i: i32 = 0; i < resultLen; i++) {
    store<u8>(RESULT_BUFFER + outOffset + i, result.result[i]);
  }
  outOffset += resultLen;

  // Set result pointer and length
  result_ptr = RESULT_BUFFER;
  result_len = outOffset;
}
