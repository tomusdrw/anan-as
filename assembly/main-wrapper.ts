// TODO [ToDr] refactor

/**
 * PVM-in-PVM Main Entry Point
 *
 * This module provides a main() function that follows the SPI entrypoint convention,
 * allowing anan-as to be compiled to PVM and run as a standalone interpreter.
 *
 * Input format (args):
 *   - program_len: u32 (4 bytes, little-endian)
 *   - program: u8[program_len] (PVM program blob)
 *   - registers: u8[104] (13 * 8 bytes, little-endian u64s)
 *   - gas: u64 (8 bytes, little-endian)
 *   - steps: u32 (4 bytes, little-endian)
 *
 * Output format (written to result_ptr):
 *   - status: u8 (1 byte)
 *   - pc: u32 (4 bytes, little-endian)
 *   - gas_left: u64 (8 bytes, little-endian)
 *   - registers: u8[104] (13 * 8 bytes, little-endian u64s)
 * Total: 117 bytes
 */

import { getGasLeft, getProgramCounter, getRegisters, getStatus, nSteps, resetJAM } from "./api-debugger";

// Result buffer location (in WASM linear memory)
const RESULT_BUFFER: u32 = 0x100; // After globals area

// Globals for result pointer and length (SPI convention)
// These must be mutable globals that the compiler can read
export let result_ptr: u32 = 0;
export let result_len: u32 = 0;

/**
 * Main entry point following SPI convention.
 * @param args_ptr Pointer to input arguments (PVM address 0xFEFF0000)
 * @param args_len Length of arguments in bytes
 */
export function pvmMain(args_ptr: u32, args_len: u32): void {
  // Minimum input: 4 (program_len) + 0 (program) + 104 (registers) + 8 (gas) + 4 (steps) = 120 bytes
  if (args_len < 120) {
    // Invalid input - return error status
    store<u8>(RESULT_BUFFER, 1); // PANIC status
    result_ptr = RESULT_BUFFER;
    result_len = 1;
    return;
  }

  let offset: u32 = 0;

  // Read program length (4 bytes, little-endian)
  const program_len = load<u32>(args_ptr + offset);
  offset += 4;

  // Validate we have enough data
  const expected_len: u32 = 4 + program_len + 104 + 8 + 4;
  if (args_len < expected_len) {
    store<u8>(RESULT_BUFFER, 1); // PANIC status
    result_ptr = RESULT_BUFFER;
    result_len = 1;
    return;
  }

  // Read program bytes into array
  const program: u8[] = [];
  for (let i: u32 = 0; i < program_len; i++) {
    program.push(load<u8>(args_ptr + offset + i));
  }
  offset += program_len;

   // Read gas (8 bytes, little-endian u64)
   const gas = load<u64>(args_ptr + offset);
   offset += 8;

   // Read steps (4 bytes, little-endian u32)
   const steps = load<u32>(args_ptr + offset);
   offset += 4;

   // Read inner program args (remaining bytes)
   const innerArgs: u8[] = [];
   for (let i: u32 = offset; i < args_len; i++) {
     innerArgs.push(load<u8>(args_ptr + i));
   }

    // Initialize interpreter with SPI program
    resetJAM(program, <u32>0, gas, innerArgs);

   // Run steps
   nSteps(steps);

   // Get results
   const status = getStatus();
   const pc = getProgramCounter();
   const gasLeft = getGasLeft();
   const finalRegisters = getRegisters();

   // Write output to result buffer
   let out_offset: u32 = 0;

   // Status (1 byte)
   store<u8>(RESULT_BUFFER + out_offset, status);
   out_offset += 1;

   // PC (4 bytes)
   store<u32>(RESULT_BUFFER + out_offset, pc);
   out_offset += 4;

   // Gas left (8 bytes)
   store<u64>(RESULT_BUFFER + out_offset, gasLeft);
   out_offset += 8;

   // Registers (104 bytes)
   const final_len: u32 = <u32>finalRegisters.length;
   for (let i: u32 = 0; i < final_len; i++) {
     store<u8>(RESULT_BUFFER + out_offset + i, finalRegisters[i]);
   }
   out_offset += final_len;

  // Set result pointer and length
  result_ptr = RESULT_BUFFER;
  result_len = out_offset;
}
