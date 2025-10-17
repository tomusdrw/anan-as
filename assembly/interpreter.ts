import { Args } from "./arguments";
import { GasCounter, gasCounter } from "./gas";
import { INSTRUCTIONS, MISSING_INSTRUCTION, SBRK } from "./instructions";
import { Outcome, OutcomeData, Result } from "./instructions/outcome";
import { reg } from "./instructions/utils";
import { RUN } from "./instructions-exe";
import { Memory, MemoryBuilder } from "./memory";
import { PAGE_SIZE, PAGE_SIZE_SHIFT, RESERVED_MEMORY } from "./memory-page";
import { BasicBlocks, decodeArguments, JumpTable, Program, ProgramCounter } from "./program";
import { Registers } from "./registers";

export enum Status {
  OK = -1,
  HALT = 0,
  PANIC = 1,
  FAULT = 2,
  HOST = 3,
  OOG = 4,
}

export class Interpreter {
  public readonly program: Program;
  public readonly registers: Registers;
  public readonly memory: Memory;
  public readonly gas: GasCounter;
  // TODO [ToDr] consider making this just getters?
  public pc: u32;
  public status: Status;
  public exitCode: u32;
  public nextPc: u32;
  public useSbrkGas: boolean;

  private djumpRes: DjumpResult = new DjumpResult();
  private argsRes: Args = new Args();
  private outcomeRes: OutcomeData = new OutcomeData();
  private branchRes: BranchResult = new BranchResult();

  constructor(program: Program, registers: Registers, memory: Memory = new MemoryBuilder().build(0)) {
    this.program = program;
    this.registers = registers;
    this.memory = memory;
    this.gas = gasCounter(i64(0));
    this.pc = 0;
    this.status = Status.OK;
    this.exitCode = 0;
    this.nextPc = 0;
    this.useSbrkGas = false;
  }

  nextSteps(nSteps: u32 = 1): boolean {
    // resuming after host call
    if (this.status === Status.HOST) {
      // let's assume all is good and move on :)
      this.status = Status.OK;
      // apply the nextPc, but don't stop, rather continue
      // executing right away.
      this.pc = this.nextPc;
      this.nextPc = -1;
    }

    if (this.status !== Status.OK) {
      return false;
    }

    // TODO [ToDr] Some weird pre-init step for the debugger?
    if (this.nextPc !== -1) {
      this.pc = this.nextPc;
      this.nextPc = -1;
      return true;
    }

    const program = this.program;
    const code = program.code;
    const mask = program.mask;
    const argsRes = this.argsRes;
    const outcomeRes = this.outcomeRes;

    for (let i: u32 = 0; i < nSteps; i++) {
      // reset some stuff at start
      this.exitCode = 0;
      outcomeRes.result = Result.PANIC;
      outcomeRes.outcome = Outcome.Ok;

      const pc = this.pc;
      // check if we are at the right location
      if (!mask.isInstruction(pc)) {
        // TODO [ToDr] Potential edge case here?
        if (this.gas.sub(MISSING_INSTRUCTION.gas)) {
          this.status = Status.OOG;
        } else {
          this.status = Status.PANIC;
        }
        return false;
      }

      const instruction = code[pc];
      const iData = <i32>instruction < INSTRUCTIONS.length ? INSTRUCTIONS[instruction] : MISSING_INSTRUCTION;

      // check gas (might be done for each block instead).
      if (this.gas.sub(iData.gas)) {
        this.status = Status.OOG;
        return false;
      }

      if (iData === MISSING_INSTRUCTION) {
        this.status = Status.PANIC;
        return false;
      }

      // get args and invoke instruction
      const skipBytes = mask.skipBytesToNextInstruction(pc);
      const args = decodeArguments(argsRes, iData.kind, code, pc + 1, skipBytes);

      // additional gas cost of sbrk
      if (iData === SBRK && this.useSbrkGas) {
        const alloc = u64(u32(this.registers[reg(args.a)]));
        const gas = ((alloc + u64(PAGE_SIZE) - u64(1)) >> PAGE_SIZE_SHIFT) * u64(16);
        if (this.gas.sub(i64(gas))) {
          this.status = Status.OOG;
          return false;
        }
      }

      const exe = RUN[instruction];
      const outcome = exe(outcomeRes, args, this.registers, this.memory);

      // TODO [ToDr] Spaghetti
      switch (outcome.outcome) {
        case Outcome.DynamicJump: {
          const res = dJump(this.djumpRes, program.jumpTable, outcome.dJump);
          if (res.status === DjumpStatus.HALT) {
            this.status = Status.HALT;
            return false;
          }
          if (res.status === DjumpStatus.PANIC) {
            this.status = Status.PANIC;
            return false;
          }
          const branchResult = branch(this.branchRes, program.basicBlocks, res.newPc, 0);
          if (!branchResult.isOkay) {
            this.status = Status.PANIC;
            return false;
          }
          this.pc = branchResult.newPc;
          continue;
        }
        case Outcome.StaticJump: {
          const branchResult = branch(this.branchRes, program.basicBlocks, pc, outcome.staticJump);
          if (!branchResult.isOkay) {
            this.status = Status.PANIC;
            return false;
          }

          this.pc = branchResult.newPc;
          continue;
        }
        case Outcome.Result: {
          if (outcome.result === Result.HOST) {
            this.status = Status.HOST;
            this.exitCode = outcome.exitCode;
            // set the next PC after the host call is called.
            this.nextPc = this.pc + 1 + skipBytes;
            return false;
          }
          if (outcome.result === Result.FAULT) {
            this.gas.sub(i64(1));
            // access to reserved memory should end with a panic.
            if (outcome.exitCode < RESERVED_MEMORY) {
              this.status = Status.PANIC;
            } else {
              this.status = Status.FAULT;
              this.exitCode = outcome.exitCode;
            }
            return false;
          }
          if (outcome.result === Result.FAULT_ACCESS) {
            this.gas.sub(i64(1));
            this.status = Status.PANIC;
            // this.exitCode = outcome.exitCode;
            return false;
          }
          if (outcome.result === Result.PANIC) {
            this.status = Status.PANIC;
            this.exitCode = outcome.exitCode;
            return false;
          }

          throw new Error("Unknown result");
        }
        case Outcome.Ok: {
          // by default move to next instruction.
          this.pc += 1 + skipBytes;
          continue;
        }
      }
    }

    return true;
  }
}

// @unmanaged
class BranchResult {
  isOkay: boolean = false;
  newPc: u32 = 0;
}

function branch(r: BranchResult, basicBlocks: BasicBlocks, pc: u32, offset: i32): BranchResult {
  const newPc = pc + offset;
  if (basicBlocks.isStart(newPc)) {
    r.isOkay = true;
    r.newPc = newPc;
  } else {
    r.isOkay = false;
    r.newPc = 0;
  }
  return r;
}

enum DjumpStatus {
  OK = 0,
  HALT = 1,
  PANIC = 2,
}

// @unmanaged
class DjumpResult {
  status: DjumpStatus = DjumpStatus.OK;
  newPc: ProgramCounter = 0;
}

const EXIT = 0xff_ff_00_00;
const JUMP_ALIGMENT_FACTOR = 2;

function dJump(r: DjumpResult, jumpTable: JumpTable, address: u32): DjumpResult {
  if (address === EXIT) {
    r.status = DjumpStatus.HALT;
    return r;
  }
  if (address === 0 || address % JUMP_ALIGMENT_FACTOR !== 0) {
    r.status = DjumpStatus.PANIC;
    return r;
  }

  const index = address / JUMP_ALIGMENT_FACTOR - 1;
  if (index >= u32(jumpTable.jumps.length)) {
    r.status = DjumpStatus.PANIC;
    return r;
  }

  const newPc: u64 = unchecked(jumpTable.jumps[index]);
  if (newPc >= MAX_U32) {
    r.status = DjumpStatus.PANIC;
    return r;
  }

  r.status = DjumpStatus.OK;
  r.newPc = u32(newPc);
  return r;
}

const MAX_U32: u64 = u64(2 ** 32);
