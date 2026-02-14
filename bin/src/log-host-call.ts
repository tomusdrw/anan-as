import { pvmReadMemory } from "../../build/release.js";

export const LOG_HOST_CALL_INDEX = 100;
export const LOG_GAS_COST = 10n;
/** The WHAT return value - indicates the host call is not implemented / acknowledged. */
export const WHAT = 0xfffffffffffffffen;

const LOG_LEVELS = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG"];

/**
 * Print the log message from a JIP-1 log host call (ecalli 100).
 *
 * Reads the level, target, and message from the PVM registers and memory,
 * then prints via console.info.
 */
export function printLogHostCall(pvmId: number, registers: bigint[]): void {
  const level = Number(registers[7]);
  const targetPtr = Number(registers[8] & 0xffffffffn);
  const targetLen = Number(registers[9] & 0xffffffffn);
  const messagePtr = Number(registers[10] & 0xffffffffn);
  const messageLen = Number(registers[11] & 0xffffffffn);

  const levelStr = LOG_LEVELS[level] ?? `LEVEL(${level})`;

  let target = "";
  if (targetPtr !== 0 && targetLen > 0) {
    const targetBytes = pvmReadMemory(pvmId, targetPtr, targetLen);
    if (targetBytes) {
      target = new TextDecoder().decode(targetBytes);
    }
  }

  let message = "";
  if (messagePtr !== 0 && messageLen > 0) {
    const messageBytes = pvmReadMemory(pvmId, messagePtr, messageLen);
    if (messageBytes) {
      message = new TextDecoder().decode(messageBytes);
    }
  }

  if (target) {
    console.info(`[${levelStr}] ${target}: ${message}`);
  } else {
    console.info(`[${levelStr}] ${message}`);
  }
}
