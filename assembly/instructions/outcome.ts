import { Args } from "../arguments";
import { MaybePageFault, Memory } from "../memory";
import { Registers } from "../registers";

export type InstructionRun = (args: Args, registers: Registers, memory: Memory) => OutcomeData;

export enum Result {
  PANIC = 2 ** 32 - 12,
  FAULT = 2 ** 32 - 13,
  HOST = 2 ** 32 - 14,
}

export enum Outcome {
  Ok = 0,
  StaticJump = 1,
  DynamicJump = 2,
  Result = 3,
}

// @unmanaged
export class OutcomeData {
  outcome: Outcome = Outcome.Ok;
  staticJump: i32 = 0;
  dJump: u32 = 0;
  result: Result = Result.PANIC;
  exitCode: u32 = 0;
}

export function status(result: Result): OutcomeData {
  const r = new OutcomeData();
  r.outcome = Outcome.Result;
  r.result = result;
  return r;
}

export function staticJump(offset: i32): OutcomeData {
  const r = new OutcomeData();
  r.outcome = Outcome.StaticJump;
  r.staticJump = offset;
  return r;
}

export function dJump(address: u32): OutcomeData {
  const r = new OutcomeData();
  r.outcome = Outcome.DynamicJump;
  r.dJump = address;
  return r;
}

export function ok(): OutcomeData {
  return new OutcomeData();
}

export function panic(): OutcomeData {
  return status(Result.PANIC);
}

export function hostCall(id: u32): OutcomeData {
  const r = new OutcomeData();
  r.outcome = Outcome.Result;
  r.result = Result.HOST;
  r.exitCode = id;
  return r;
}

export function okOrFault(pageFault: MaybePageFault): OutcomeData {
  const r = new OutcomeData();
  if (pageFault.isFault) {
    r.outcome = Outcome.Result;
    r.result = Result.FAULT;
    r.exitCode = pageFault.fault;
  }
  return r;
}
