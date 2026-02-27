import { Args } from "../arguments";
import { MaybePageFault, Memory } from "../memory";
import { Registers } from "../registers";

export type InstructionRun = (o: OutcomeData, args: Args, registers: Registers, memory: Memory) => OutcomeData;

export enum Result {
  PANIC = 0,
  FAULT = 1,
  FAULT_ACCESS = 2,
  HOST = 3,
}

export enum Outcome {
  Ok = 0,
  StaticJump = 1,
  DynamicJump = 2,
  Result = 3,
}

export class OutcomeData {
  outcome: Outcome = Outcome.Ok;
  staticJump: i32 = 0;
  dJump: u32 = 0;
  result: Result = Result.PANIC;
  exitCode: u32 = 0;
}

export function status(r: OutcomeData, result: Result): OutcomeData {
  r.outcome = Outcome.Result;
  r.result = result;
  return r;
}

export function staticJump(r: OutcomeData, offset: i32): OutcomeData {
  r.outcome = Outcome.StaticJump;
  r.staticJump = offset;
  return r;
}

export function dJump(r: OutcomeData, address: u32): OutcomeData {
  r.outcome = Outcome.DynamicJump;
  r.dJump = address;
  return r;
}

export function ok(r: OutcomeData): OutcomeData {
  // outcome is already pre-set to Ok by the interpreter loop
  return r;
}

export function panic(r: OutcomeData): OutcomeData {
  return status(r, Result.PANIC);
}

export function hostCall(r: OutcomeData, id: u32): OutcomeData {
  r.outcome = Outcome.Result;
  r.result = Result.HOST;
  r.exitCode = id;
  return r;
}

export function okOrFault(r: OutcomeData, pageFault: MaybePageFault): OutcomeData {
  if (pageFault.isFault) {
    r.outcome = Outcome.Result;
    // not accessible memory does not result in `FAULT`, but rather goes straight to TRAP
    // yet in gas calculations we still subtract 1, unlike TRAP, but like FAULT.
    r.result = pageFault.isAccess ? Result.FAULT_ACCESS : Result.FAULT;
    r.exitCode = pageFault.fault;
  }
  return r;
}
