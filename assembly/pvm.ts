import { GasCounter } from "./gas";
import { Status } from "./interpreter";
import { Memory } from "./memory";
import { Program } from "./program";
import { Registers } from "./registers";

export { Status };

/** Common interface for Interpreter and FastInterpreter. */
export interface Pvm {
  readonly program: Program;
  readonly registers: Registers;
  readonly memory: Memory;
  readonly gas: GasCounter;
  pc: u32;
  status: Status;
  exitCode: u32;
  nextPc: u32;
  nextSteps(nSteps: u32): boolean;
}
