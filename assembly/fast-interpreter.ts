import { Args } from "./arguments";
import { GasCounter, gasCounter } from "./gas";
import { MISSING_INSTRUCTION } from "./instructions";
import { Outcome, OutcomeData, Result } from "./instructions/outcome";
import { RUN } from "./instructions-exe";
import { DjumpResult, DjumpStatus, Status } from "./interpreter";
import { Memory, MemoryBuilder } from "./memory";
import { RESERVED_MEMORY } from "./memory-page";
import { BasicBlocks, Code, FLAG_MISSING, GasCosts, JumpTable, Mask, PrecompiledProgram, Program } from "./program";
import { Pvm } from "./pvm";
import { Registers } from "./registers";

/**
 * FastInterpreter uses a pre-compiled instruction tape built by `deblobFast()`,
 * eliminating per-instruction decoding overhead from the hot loop.
 *
 * Tape layout (6 x u32 = 24 bytes per instruction):
 *   Slot 0 (meta):   opcode:8 | flags:2 | skipBytes:6 | gasCost:16
 *   Slot 1:          originalPc
 *   Slot 2-5:        args.a, args.b, args.c, args.d
 */
export class FastInterpreter implements Pvm {
  // Lazily-constructed Program for Pvm interface compatibility (logging only).
  // Not used on the hot path — FastInterpreter uses the tape directly.
  private _program: Program | null = null;
  private _code: Code;
  private _mask: Mask;

  get program(): Program {
    if (this._program === null) {
      const blocks = new BasicBlocks(this._code, this._mask);
      const gasCosts = new GasCosts(this._code, this._mask, blocks, false);
      this._program = new Program(this._code, this._mask, this.jumpTable, blocks, gasCosts);
    }
    // biome-ignore lint/style/noNonNullAssertion: assigned in the null check above
    return this._program!;
  }

  public readonly registers: Registers;
  public readonly memory: Memory;
  public readonly gas: GasCounter;
  public pc: u32;
  public status: Status;
  public exitCode: u32;
  public nextPc: u32;

  // Pre-computed data (from PrecompiledProgram)
  private tape: StaticArray<u32>;
  private pcToIndex: StaticArray<u32>;
  private blockTapeIndex: StaticArray<u32>;
  private jumpTable: JumpTable;

  // Pre-allocated result objects (reused each step)
  private djumpRes: DjumpResult = new DjumpResult();
  private outcomeRes: OutcomeData = new OutcomeData();
  private argsRes: Args = new Args();

  constructor(precompiled: PrecompiledProgram, registers: Registers, memory: Memory = new MemoryBuilder().build(0)) {
    this._code = precompiled.code;
    this._mask = precompiled.mask;
    this.registers = registers;
    this.memory = memory;
    this.gas = gasCounter(i64(0));
    this.pc = 0;
    this.status = Status.OK;
    this.exitCode = 0;
    this.nextPc = 0;

    // Pre-computed data from deblobFast()
    this.tape = precompiled.tape;
    this.pcToIndex = precompiled.pcToIndex;
    this.blockTapeIndex = precompiled.blockTapeIndex;
    this.jumpTable = precompiled.jumpTable;
  }

  nextSteps(nSteps: u32 = 1): boolean {
    // resuming after host call
    if (this.status === Status.HOST) {
      this.status = Status.OK;
      this.pc = this.nextPc;
      this.nextPc = -1;
    }

    if (this.status !== Status.OK) {
      return false;
    }

    // Debugger pre-init step
    if (this.nextPc !== <u32>-1) {
      this.pc = this.nextPc;
      this.nextPc = -1;
      return true;
    }

    // Reset exitCode once per call (not per instruction)
    this.exitCode = 0;

    // Cache fields in locals to avoid repeated heap loads
    const tape = this.tape;
    const tapeLen = u32(tape.length);
    const pcToIndex = this.pcToIndex;
    const blockTapeIndex = this.blockTapeIndex;
    const blockLen = u32(blockTapeIndex.length);
    const jumpTable = this.jumpTable;
    const outcomeRes = this.outcomeRes;
    const argsRes = this.argsRes;

    // Convert current PC to tape index (pcToIndex stores tapeIdx+1, 0 = sentinel)
    const currentPc = this.pc;
    if (currentPc >= u32(pcToIndex.length)) {
      if (this.gas.sub(MISSING_INSTRUCTION.gas)) {
        this.status = Status.OOG;
      } else {
        this.status = Status.PANIC;
      }
      return false;
    }

    const pcIdx = unchecked(pcToIndex[i32(currentPc)]);
    if (pcIdx === 0) {
      if (this.gas.sub(MISSING_INSTRUCTION.gas)) {
        this.status = Status.OOG;
      } else {
        this.status = Status.PANIC;
      }
      return false;
    }
    let idx = pcIdx - 1;

    for (let i: u32 = 0; i < nSteps; i++) {
      // Pre-set outcome to Ok (required: ok() relies on this being pre-set)
      outcomeRes.outcome = Outcome.Ok;

      // Read 6 u32 slots from tape (no bit unpacking needed for args)
      const meta = unchecked(tape[i32(idx)]);
      const originalPc = unchecked(tape[i32(idx) + 1]);
      argsRes.a = unchecked(tape[i32(idx) + 2]);
      argsRes.b = unchecked(tape[i32(idx) + 3]);
      argsRes.c = unchecked(tape[i32(idx) + 4]);
      argsRes.d = unchecked(tape[i32(idx) + 5]);

      // Unpack metadata: opcode:8 | flags:2 | skipBytes:6 | gasCost:16
      const opcode = meta & 0xff;
      const flags = u8((meta >> 8) & 0x3);
      const skipBytes = (meta >> 10) & 0x3f;
      const gasCost = meta >> 16;

      // Check gas
      if (this.gas.sub(gasCost)) {
        this.pc = originalPc;
        this.status = Status.OOG;
        return false;
      }

      // Handle MISSING_INSTRUCTION
      if (flags & FLAG_MISSING) {
        this.pc = originalPc;
        this.status = Status.PANIC;
        return false;
      }

      // Execute
      const exe = unchecked(RUN[opcode]);
      const outcome = exe(outcomeRes, argsRes, this.registers, this.memory);

      // Fast path: Ok is the most common outcome (~70%+ of instructions)
      if (outcome.outcome === Outcome.Ok) {
        idx += 6;
        if (idx >= tapeLen) {
          // Past the end of the tape — set PC for next entry
          this.pc = originalPc + 1 + skipBytes;
          return true;
        }
        continue;
      }

      switch (outcome.outcome) {
        case Outcome.StaticJump: {
          // Single lookup: blockTapeIndex gives both validation + tape index
          const newPc = u32(i32(originalPc) + outcome.staticJump);
          if (newPc >= blockLen) {
            this.pc = originalPc;
            this.status = Status.PANIC;
            return false;
          }
          const blockIdx = unchecked(blockTapeIndex[i32(newPc)]);
          if (blockIdx === 0) {
            this.pc = originalPc;
            this.status = Status.PANIC;
            return false;
          }
          idx = blockIdx - 1;
          continue;
        }
        case Outcome.DynamicJump: {
          const res = dJump(this.djumpRes, jumpTable, outcome.dJump);
          if (res.status === DjumpStatus.HALT) {
            this.pc = originalPc;
            this.status = Status.HALT;
            return false;
          }
          if (res.status === DjumpStatus.PANIC) {
            this.pc = originalPc;
            this.status = Status.PANIC;
            return false;
          }
          // Single lookup for block validation + tape index
          const newPc = res.newPc;
          if (newPc >= blockLen) {
            this.pc = originalPc;
            this.status = Status.PANIC;
            return false;
          }
          const blockIdx = unchecked(blockTapeIndex[i32(newPc)]);
          if (blockIdx === 0) {
            this.pc = originalPc;
            this.status = Status.PANIC;
            return false;
          }
          idx = blockIdx - 1;
          continue;
        }
        case Outcome.Result: {
          if (outcome.result === Result.HOST) {
            this.status = Status.HOST;
            this.exitCode = outcome.exitCode;
            this.nextPc = originalPc + 1 + skipBytes;
            this.pc = originalPc;
            return false;
          }
          if (outcome.result === Result.FAULT) {
            if (outcome.exitCode < RESERVED_MEMORY) {
              this.status = Status.PANIC;
            } else {
              this.status = Status.FAULT;
              this.exitCode = outcome.exitCode;
            }
            this.pc = originalPc;
            return false;
          }
          if (outcome.result === Result.FAULT_ACCESS) {
            this.status = Status.PANIC;
            this.pc = originalPc;
            return false;
          }
          if (outcome.result === Result.PANIC) {
            this.status = Status.PANIC;
            this.exitCode = outcome.exitCode;
            this.pc = originalPc;
            return false;
          }

          throw new Error("Unknown result");
        }
      }
    }

    // Convert tape index back to PC (only reached when nSteps is exhausted)
    if (idx < tapeLen) {
      this.pc = unchecked(tape[i32(idx) + 1]);
    } else {
      // Past the end — compute from last instruction
      const lastMeta = unchecked(tape[i32(idx) - 6]);
      const lastOriginalPc = unchecked(tape[i32(idx) - 5]);
      const lastSkipBytes = (lastMeta >> 10) & 0x3f;
      this.pc = lastOriginalPc + 1 + lastSkipBytes;
    }

    return true;
  }
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

  const index = u32(address / JUMP_ALIGMENT_FACTOR) - 1;
  if (index >= <u32>jumpTable.jumps.length) {
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

const MAX_U32: u64 = u64(0x1_0000_0000);
