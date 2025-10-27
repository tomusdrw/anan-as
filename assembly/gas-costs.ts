import { Args } from "./arguments";
import { OpsCost } from "./gas-pricing";
import {
  BRANCH_COST,
  BRANCH_COST_REGULAR,
  BRANCH_COST_UNLIKELY,
  INSTRUCTIONS,
  Instruction,
  MEMORY_COST,
  MEMORY_COST_L2HIT,
  MISSING_INSTRUCTION,
  MOVE_REG,
  TRAP,
  UNLIKELY,
  VIRTUAL_TRAP,
} from "./instructions";
import { REGISTERS, RegisterIndex, UNUSED_REGISTER, UsedRegisters } from "./instructions-regs";
import { decodeArguments, Program } from "./program";

export class BlockGasCost {
  pc: u32 = 0;
  gas: u64 = 0;
}

type PC = u32;

enum InstructionStatus {
  REMOVED = 0,
  DECODED = 1,
  WAITING = 2,
  EXECUTING = 3,
  RETIRED = 4,
  /** Special states just for visualisation in history */
  FINISHED = 5,
  RUNNING_FINISHED = 6,
  EMPTY = 255,
}
function statusToStr(s: InstructionStatus): string {
  if (s === InstructionStatus.REMOVED) {
    return `.`;
  }
  if (s === InstructionStatus.DECODED) {
    return `D`;
  }
  if (s === InstructionStatus.WAITING) {
    return `=`;
  }
  if (s === InstructionStatus.EXECUTING) {
    return `e`;
  }
  if (s === InstructionStatus.RETIRED) {
    return `R`;
  }
  if (s === InstructionStatus.FINISHED) {
    return `-`;
  }
  if (s === InstructionStatus.RUNNING_FINISHED) {
    return `E`;
  }
  return `?`;
}

/**
 * The gas cost ϱı for a given basic block starting at instruction opcode index ı∈ ϖ is defined
 * by the number of virtual CPU cycles as determined by the the gas cost model transition
 * function, up until every instruction of the basic block it has ingested has been retired
 * and the simulation has converged.
 */
export class SimulationState {
  /** c_dot: Calculated cost */
  c_dot: u32 = 0;
  /** n_dot */
  n_dot: u32 = 0;
  /** d_dot: pending slots? */
  d_dot: u32 = 4;
  /** e_dot */
  e_dot: u32 = 5;
  /** s_rarr: simulation state for that instruction? */
  s_vec: InstructionStatus[] = [];
  /** c_rarr: reorder buffer instructions costs? */
  c_vec: i32[] = [];
  /** p_rarr: which previous instructions we have overlapping registers with? */
  p_vec: u32[][] = [];
  // TODO [ToDr] Rather use fixed-size object to store registers?
  /** r_rarr */
  r_vec: RegisterIndex[][] = [];
  /** x_rarr: a vector of instructions (and their costs) that await execution by virtual CPU. */
  x_vec: OpsCost[] = [];
  /** Additional data - instruction name pointer */
  name_vec: usize[] = [];
  /** Additional data - vcpu history for given instruction (0 - no vcpu) */
  hist_vec: i32[][] = [];

  x_dot: OpsCost = OpsCost.alsmd(4, 4, 4, 1, 1);

  constructor(
    /** no_dot_i */
    public pc: PC,
  ) {}

  getDecodedCount(): i32 {
    const all = [this.s_vec.length, this.x_vec.length, this.p_vec.length, this.c_vec.length];
    const min: i32 = all[0];
    for (let i = 0; i < all.length; i++) {
      if (all[i] !== min) {
        throw new Error(`All vectors are expected to have the same length! Got: ${all[i]}, want: ${min}`);
      }
    }

    return min;
  }

  toString(): string {
    let s = `pc=${this.pc}, d_dot=${this.d_dot}, e_dot=${this.e_dot}\n`;
    // print out
    s += `  :s| c | r |  p  | x\n`;
    const len = this.getDecodedCount();
    for (let j = 0; j < len; j++) {
      s += `${j.toString().padStart(2, " ")}:`;
      s += `${statusToStr(this.s_vec[j])}|`;
      s += `${this.c_vec[j].toString().padStart(2, " ")}|`;
      s += `${this.r_vec[j].join(",").padStart(3, " ")}|`;
      s += `${this.p_vec[j].join(",").padStart(3, " ")}|`;
      s += ` ${this.x_vec[j]} `;
      s += `${changetype<string>(this.name_vec[j])}\n`;
    }
    s += `c_dot=${this.c_dot}, n_dot=${this.n_dot}, x_dot=${this.x_dot}`;
    return s;
  }
}

const ERROR = 2 ** 32 - 1;
/**
 * A.52: The function S(Ξn) which checks which instruction inside of the reorder buffer is ready to start executing (and whether such an instruction even exists) is defined as follows:
 */
function checkReorderBuffer(_stepN: u32, state: SimulationState): u32 {
  const len = state.getDecodedCount();
  for (let j = 0; j < len; j++) {
    const s_cond = state.s_vec[j] === InstructionStatus.WAITING;
    // TODO [ToDr] what does this comparison mean?
    const x_cond = state.x_vec[j].isLessOrEqual(state.x_dot);
    if (s_cond && x_cond) {
      // now check all `k`
      let allGood = true;
      const p_j = state.p_vec[j];
      for (let k = 0; k < p_j.length; k++) {
        allGood = allGood && state.c_vec[p_j[k]] <= 0;
      }

      if (allGood) {
        return j;
      }
    }
  }
  return ERROR;
}

/**
 * Modifies `state` from `stepN` to `stepN + 1`.
 */
export function simulationStep(stepN: u32, state: SimulationState, p: Program): boolean {
  const registers = usedRegisters(p, state.pc);
  const cond2 =
    !p.basicBlocks.isStart(state.pc) && d_revhat(p, state.pc, registers) <= state.d_dot && state.s_vec.length < 32;
  // TODO [ToDr] Diverging!
  const canDecodeMore = state.pc <= u32(p.code.length);
  if (canDecodeMore && (stepN === 0 || cond2)) {
    decodeMoreInstructions(stepN, state, p);
    console.log(`(step=${stepN}) decoding. Done: ${state}`);
    return true;
  }

  if (checkReorderBuffer(stepN, state) !== ERROR && state.e_dot > 0) {
    executePendingInstructions(stepN, state);
    // console.log(`(step=${stepN}) execute pending. Done: ${state}`);
    return true;
  }

  if (stepN !== 0 && isZero(state.s_vec)) {
    console.log(`(step=${stepN}) done: ${state}`);
    return false;
  }

  executeVcpu(stepN, state);
  console.log(`(step=${stepN}) vcpu. Done: ${state}`);
  return true;
}

function isZero(s_vec: InstructionStatus[]): boolean {
  // TODO [ToDr] not sure how to intepret this?
  // I guess when we have |s_vec| === 0 zero we only have zeroed entries?
  for (let j = 0; j < s_vec.length; j++) {
    if (s_vec[j] !== InstructionStatus.REMOVED) {
      return false;
    }
  }
  return true;
}

/**
 * A.48 The state transition function Ξ′(n+1) which decodes the instructions into a reorder
 * buffer without triggering the virtual CPU pipeline simulation is defined as follows
 * (those pieces of state which are not explicitly mentioned by the equations are assumed to
 * be unchanged and omitted for clarity):
 */
function decodeMoreInstructions(_stepN: u32, state: SimulationState, p: Program): void {
  const iData = getInstructionData(p, state.pc);
  const registers = usedRegisters(p, state.pc);
  console.log(`Decoding opcode: ${changetype<string>(iData.namePtr)}. ${registers}`);
  // mov
  if (iData === MOVE_REG) {
    state.pc = state.pc + 1 + p.mask.skipBytesToNextInstruction(state.pc);
    state.d_dot = state.d_dot - 1;
    const len = state.getDecodedCount();
    for (let j = 0; j < len; j++) {
      const r_vec = state.r_vec[j];
      if (registers.isSourceAndDestinationTheSame()) {
        // no change
        state.r_vec[j] = r_vec;
      } else if (registers.sourceOverlapsWith(r_vec)) {
        if (registers.destination !== UNUSED_REGISTER) {
          state.r_vec[j].push(registers.destination);
        }
      } else if (registers.destinationOverlapsWith(r_vec)) {
        state.r_vec[j] = registers.computeOverlapWithSource(r_vec);
      } else {
        // no change
        state.r_vec[j] = r_vec;
      }
    }
    // decode
  } else {
    const pc = state.pc;
    state.pc = pc + 1 + p.mask.skipBytesToNextInstruction(pc);
    state.d_dot = state.d_dot - d_revhat(p, pc, registers);
    const idx = state.n_dot;
    state.s_vec[idx] = InstructionStatus.DECODED;
    state.c_vec[idx] = c_revhat(p, pc);
    state.x_vec[idx] = x_revhat(p, pc);
    state.r_vec[idx] = registers.destination === UNUSED_REGISTER ? [] : [registers.destination];
    state.p_vec[idx] = getInstructionsWithOverlappingRegisters(registers, state.r_vec);
    state.n_dot = state.n_dot + 1;
    state.name_vec[idx] = iData.namePtr;
    state.hist_vec[idx] = [];
  }
}

function getInstructionsWithOverlappingRegisters(registers: UsedRegisters, r_vec: RegisterIndex[][]): u32[] {
  const useTestVersion = false;
  // TODO [ToDr] diverging: seems that if some later instruction overwrites the registers,
  // we can safely start executing something further down the line in parallel (branch prediction?)
  if (useTestVersion) {
    const maxForEachDestination = new Map<u32, u32>();
    for (let j = 0; j < r_vec.length - 1; j++) {
      const overlap = registers.computeOverlapWithSource(r_vec[j]);
      for (let k = 0; k < overlap.length; k++) {
        maxForEachDestination.set(overlap[k], j);
      }
    }
    return maxForEachDestination.values();
  }

  // below code is implementing the GP (but it fails some tests?)
  const res: u32[] = [];
  // TODO [ToDr] we do -1 here, because we've already added the new `r_vec` (so we always have overlap with ourselves)
  for (let j = 0; j < r_vec.length - 1; j++) {
    if (registers.sourceOverlapsWith(r_vec[j])) {
      res.push(j);
    }
  }
  return res;
}

/**
 * A.51 The state transition function Ξ′′(n+1) which starts the execution of the next
 * pending instruction is defined as follows:
 */
function executePendingInstructions(stepN: u32, state: SimulationState): void {
  const reorder = checkReorderBuffer(stepN, state);
  if (reorder === ERROR) {
    throw new Error("reorder must not be null");
  }
  state.s_vec[reorder] = InstructionStatus.EXECUTING;
  state.x_dot = state.x_dot.subtract(state.x_vec[reorder]);
  state.e_dot -= 1;
}

/**
 * A.53 The state transition function Ξ′′′(n+1) which simulates the rest of the virtual
 * CPU pipeline is defined as follows:
 */
function executeVcpu(_stepN: u32, state: SimulationState): void {
  const len = state.getDecodedCount();
  const previous_s = state.s_vec.slice();
  const previous_c = state.c_vec.slice();
  let vcpuStep = 0;
  for (let j = 0; j < len; j++) {
    vcpuStep = state.hist_vec[j].length > vcpuStep ? state.hist_vec[j].length : vcpuStep;
  }

  for (let j = 0; j < len; j++) {
    const s_n = previous_s[j];
    const c_n: i32 = previous_c[j];

    // check if previous steps are all finished
    let canZero = true;
    for (let k = 0; k <= j; k++) {
      // TODO [ToDr] we probably can zero-out the DONE steps?
      canZero = canZero && (previous_s[k] === InstructionStatus.RETIRED || previous_s[k] === InstructionStatus.REMOVED);
    }
    // transition
    if (canZero) {
      state.s_vec[j] = InstructionStatus.REMOVED;
    } else if (s_n === InstructionStatus.DECODED) {
      state.s_vec[j] = InstructionStatus.WAITING;
    } else if (s_n === InstructionStatus.EXECUTING && c_n === 0) {
      state.s_vec[j] = InstructionStatus.RETIRED;
    } else {
      state.s_vec[j] = s_n;
    }

    state.c_vec[j] = s_n === InstructionStatus.EXECUTING ? c_n - 1 : c_n;
    state.r_vec[j] = s_n === InstructionStatus.EXECUTING && c_n === 1 ? [] : state.r_vec[j];
    state.hist_vec[j][vcpuStep] = s_n;
    if (s_n === InstructionStatus.EXECUTING && c_n === 0) {
      state.hist_vec[j][vcpuStep] = InstructionStatus.RUNNING_FINISHED;
    }
    if (s_n === InstructionStatus.RETIRED && c_n === -1 && !canZero) {
      state.hist_vec[j][vcpuStep] = InstructionStatus.FINISHED;
    }
  }
  let sum = state.x_dot;
  for (let j = 0; j < state.x_vec.length; j++) {
    if (state.c_vec[j] === 1) {
      sum = sum.add(state.x_vec[j]);
    }
  }
  state.x_dot = sum;
  state.c_dot += 1;
  state.d_dot = 4;
  state.e_dot = 5;
}

/**
 * The function s_revhat(c,k,ı) returns a set of source registers read by a given instruction,
 * and the function r_revhat(c,k,ı) returns a set of destination registers which are written
 * by a given instruction, regardless of whether those registers would actually have been
 * modified by that instruction when executed at runtime. ecalli is assumed to not read nor
 * write to any registers in this model.
 *
 * instead of separating `s_revhat` and `r_revhat` we simply decode all used registers and check
 * overlap
 */
function usedRegisters(p: Program, pc: PC): UsedRegisters {
  const iData = getInstructionData(p, pc);
  const argsRes = new Args();
  const skipBytes = p.mask.skipBytesToNextInstruction(pc);
  const args = decodeArguments(argsRes, iData.kind, p.code, pc + 1, skipBytes);
  const regs = new UsedRegisters();
  // TODO [ToDr] shit
  if (iData !== VIRTUAL_TRAP) {
    const opcode = p.code[pc];
    if (<i32>opcode < REGISTERS.length) {
      REGISTERS[opcode](args, regs);
    }
  }
  return regs;
}

function d_revhat(p: Program, pc: PC, registers: UsedRegisters): u32 {
  const iData = getInstructionData(p, pc);
  if (registers.isOverlapBetweenSourceAndDestination()) {
    return iData.slotsCostOverlap;
  }
  return iData.slotsCost;
}

function c_revhat(p: Program, pc: PC): i32 {
  const iData = getInstructionData(p, pc);
  if (iData.cyclesCost === BRANCH_COST) {
    const argsRes = new Args();
    const skipBytes = p.mask.skipBytesToNextInstruction(pc);
    const args = decodeArguments(argsRes, iData.kind, p.code, pc + 1, skipBytes);
    const branchTargetPc = pc + args.c;
    const fallthroughPc = pc + 1 + skipBytes;
    const branchTarget = getInstructionData(p, branchTargetPc);
    const fallthroughTarget = getInstructionData(p, fallthroughPc);

    if (
      branchTarget === UNLIKELY ||
      branchTarget === TRAP ||
      fallthroughTarget === UNLIKELY ||
      fallthroughTarget === TRAP
    ) {
      return BRANCH_COST_UNLIKELY;
    }

    return BRANCH_COST_REGULAR;
  }
  // TODO [ToDr] handle memory model!
  return iData.cyclesCost === MEMORY_COST ? MEMORY_COST_L2HIT : iData.cyclesCost;
}

function x_revhat(p: Program, pc: PC): OpsCost {
  return getInstructionData(p, pc).opsCost;
}

function getInstructionData(p: Program, pc: PC): Instruction {
  if (pc < u32(p.code.length)) {
    const opcode = p.code[pc];
    return <i32>opcode < INSTRUCTIONS.length ? INSTRUCTIONS[opcode] : MISSING_INSTRUCTION;
  }
  return VIRTUAL_TRAP;
}

export function computeGasCosts(p: Program): Map<u32, BlockGasCost> {
  const blocks: Map<u32, BlockGasCost> = new Map();
  const len = p.code.length;

  for (let pc = 0; pc < len; pc++) {
    if (!p.basicBlocks.isStart(pc)) {
      continue;
    }
    console.log(`[${pc}] Starting simulation`);
    let stepN = 0;
    const state = new SimulationState(pc);
    for (;;) {
      console.log(`[${pc}] step=${stepN}`);
      const res = simulationStep(stepN, state, p);
      if (res === false) {
        const r = new BlockGasCost();
        r.pc = pc;
        r.gas = i32(state.c_dot) > 3 ? i32(state.c_dot) - 3 : 1;
        console.log(`[${pc}] simulation done: cost=${r.gas}`);
        let hist = "";
        for (let j = 0; j < state.hist_vec.length; j++) {
          hist += `${j.toString().padStart(2, " ")}:`;
          for (let i = 0; i < state.hist_vec[j].length; i++) {
            if (state.hist_vec[j][i] !== InstructionStatus.EMPTY) {
              hist += statusToStr(state.hist_vec[j][i]);
            }
          }
          hist += `  ${changetype<string>(state.name_vec[j])}\n`;
        }
        console.log(hist);
        blocks.set(pc, r);
        break;
      }
      stepN++;
    }
  }

  return blocks;
}

export function computeLegacyGasCosts(p: Program): Map<u32, BlockGasCost> {
  const len = p.code.length;
  const blocks: Map<u32, BlockGasCost> = new Map();
  let currentBlock: BlockGasCost | null = null;

  for (let i = 0; i < len; i++) {
    if (!p.mask.isInstruction(i)) {
      throw new Error("We should iterate only over instructions!");
    }

    const instruction = p.code[i];
    const iData = instruction >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[instruction];

    if (p.basicBlocks.isStart(i)) {
      if (currentBlock !== null) {
        blocks.set(currentBlock.pc, currentBlock);
      }
      currentBlock = new BlockGasCost();
      currentBlock.pc = i;
    }

    if (currentBlock !== null) {
      // add gas for current instruction
      currentBlock.gas += iData.gas;
    }

    // move forward
    const skipBytes = p.mask.skipBytesToNextInstruction(i);
    i += skipBytes;
  }

  // add the final block
  if (currentBlock !== null) {
    blocks.set(currentBlock.pc, currentBlock);
  }

  return blocks;
}
