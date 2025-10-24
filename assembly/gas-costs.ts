import {Args} from "./arguments";
import {OpsCost} from "./gas-pricing";
import { BRANCH_COST, BRANCH_COST_REGULAR, INSTRUCTIONS, MEMORY_COST, MEMORY_COST_L2HIT, MISSING_INSTRUCTION } from "./instructions";
import {RUN} from "./instructions-exe";
import {RegisterIndex, REGISTERS, UNUSED_REGISTER, UsedRegisters} from "./instructions-regs";
import {move_reg} from "./instructions/mov";
import { decodeArguments, Program } from "./program";

export class BlockGasCost {
  pc: u32 = 0;
  gas: u64 = 0;
}

type PC = u32;

/** Special sentinel value to indicate empty set assigned to `s_j^(n)`? */
const S_EMPTY: u32 = 0;
/**
 * The gas cost ϱı for a given basic block starting at instruction opcode index ı∈ ϖ is defined
 * by the number of virtual CPU cycles as determined by the the gas cost model transition
 * function, up until every instruction of the basic block it has ingested has been retired
 * and the simulation has converged.
 */
export class SimulationState {
  /** c_dot */
  c_dot: u32 = 0;
  /** n_dot */
  n_dot: u32 = 0;
  /** d_dot */
  d_dot: u32 = 4;
  /** e_dot */
  e_dot: u32 = 5;
  /** s_rarr */
  s_vec: u32[] = [];
  /** c_rarr */
  c_vec: u32[] = [];
  // TODO [ToDr] Rather use fixed-size object to store registers?
  /** p_rarr */
  p_vec: RegisterIndex[][] = [];
  // TODO [ToDr] Rather use fixed-size object to store registers?
  /** r_rarr */
  r_vec: RegisterIndex[][] = [];
  /** x_rarr */
  x_vec: OpsCost[] = [];

  x_dot: OpsCost = OpsCost.alsmd(4, 4, 4, 1, 1);

  constructor(
    /** no_dot_i */
    public pc: PC
  ) {}
}

function getVecLen(state: SimulationState): u32 {
  const all = [state.s_vec.length, state.x_vec.length, state.p_vec.length, state.c_vec.length];
  const min = all.reduce((a, b) => Math.min(a, b), Infinity);
  if (all.every(x => x === min)) {
    return min;
  }

  throw new Error('All vectors are expected to have the same length!');
}

/**
 * A.52: The function S(Ξn) which checks which instruction inside of the reorder buffer is ready to start executing (and whether such an instruction even exists) is defined as follows:
   */
function checkReorderBuffer(_stepN: u32, state: SimulationState): u32 | null {
  const len = getVecLen(state);
  for (let j = 0; j < len; j++) {
    const s_cond = state.s_vec[j] === 2;
    // TODO [ToDr] what does this comparison mean?
    const x_cond = state.x_vec[j].isLessOrEqual(state.x_dot);
    if (s_cond && x_cond) {
      // now check all `k`
      const p_j = state.p_vec[j];
      if (p_j.every(k => state.c_vec[k] <= 0)) {
        return j;
      }
    }
  }
  return null;
}

/**
 * Modifies `state` from `stepN` to `stepN + 1`.
 */
export function simulationStep(stepN: u32, state: SimulationState, p: Program): boolean {
  /** Note the |s_rarr| notation without `(n)` sup */
  const cond2 = !p.basicBlocks.isStart(state.pc) && d_revhat(p, state.pc) <= state.d_dot && state.s_vec.length < 32;
  if (stepN === 0 || cond2) {
    simulationStepVariant1(stepN, state, p);
    return true;
  }

  if (checkReorderBuffer(stepN, state) !== null && state.e_dot > 0) {
    simulationStepVariant2(stepN, state)
    return true;
  }

  if (stepN !== 0 && state.s_vec.length === 0) {
    return false;
  }

  simulationStepVariant3(stepN, state);
  return true;
}

/**
 * A.48 The state transition function Ξ′(n+1) which decodes the instructions into a reorder
 * buffer without triggering the virtual CPU pipeline simulation is defined as follows
 * (those pieces of state which are not explicitly mentioned by the equations are assumed to
 * be unchanged and omitted for clarity):
 */
function simulationStepVariant1(_stepN: u32, state: SimulationState, p: Program): void {
  const registers = usedRegisters(p, state.pc);
  // mov
  if (RUN[p.code[state.pc]] === move_reg) {
    state.pc = state.pc + p.mask.skipBytesToNextInstruction(state.pc);
    state.d_dot = state.d_dot - 1;
    const len = getVecLen(state);
    for (let j = 0; j < len; j ++) {
      if (registers.isSourceAndDestinationTheSame()) {
        // no change
        state.r_vec[j] = state.r_vec[j];
      } else if (registers.sourceOverlapsWith(state.r_vec[j])) {
        if (registers.destination !== UNUSED_REGISTER) {
          state.r_vec[j].push(registers.destination);
        }
      } else if (registers.destinationOverlapsWith(state.r_vec[j])) {
        state.r_vec[j] = registers.computeOverlapWithSource(state.r_vec[j]);
      } else {
        // no change
        state.r_vec[j] = state.r_vec[j];
      }
    }
  // decode
  } else {
    state.pc = state.pc + p.mask.skipBytesToNextInstruction(state.pc);
    state.d_dot = state.d_dot - d_revhat(p, state.pc);
    const idx = state.n_dot;
    state.s_vec[idx] = 1;
    state.c_vec[idx] = c_revhat(p, state.pc);
    state.x_vec[idx] = x_revhat(p, state.pc);
    state.r_vec[idx] = registers.destination === UNUSED_REGISTER ? [] : [registers.destination];
    state.p_vec[idx] = getOverlapingRegisterIndices(registers, state.r_vec);
    state.n_dot = state.n_dot + 1;
  }
}

function getOverlapingRegisterIndices(registers: UsedRegisters, r_vec: RegisterIndex[][]): RegisterIndex[] {
  const res: RegisterIndex[] = [];
  for (let j = 0; j < r_vec.length; j++) {
    if (registers.sourceOverlapsWith(r_vec[j])) {
      res.push(u8(j));
    }
  }
  return res;
}


/**
 * A.51 The state transition function Ξ′′(n+1) which starts the execution of the next
 * pending instruction is defined as follows:
 */
function simulationStepVariant2(stepN: u32, state: SimulationState): void {
  const reorder = checkReorderBuffer(stepN, state);
  if (reorder === null) {
    throw new Error('reorder must not be null');
  }
  state.s_vec[reorder] = 3;
  state.x_dot = state.x_dot.subtract(state.x_vec[reorder]);
  state.e_dot -= 1;
}

/**
 * A.53 The state transition function Ξ′′′(n+1) which simulates the rest of the virtual
 * CPU pipeline is defined as follows:
 */
function simulationStepVariant3(_stepN: u32, state: SimulationState): void {
  const len = getVecLen(state);
  const previous_s = state.s_vec.slice();

  for (let j = 0; j < len; j++) {
    const s_n = state.s_vec[j];
    const c_n = state.c_vec[j];

    let canZero = true;
    for (let k = 0; k < j; k++) {
      canZero = canZero && previous_s[k] === 4;
    }
    if (canZero) {
      state.s_vec[j] = S_EMPTY;
    } else if (s_n === 1) {
      state.s_vec[j] = 2;
    } else if (s_n === 3 && c_n === 0) {
      state.s_vec[j] = 4
    } else {
      state.s_vec[j] = s_n;
    }
    state.c_vec[j] = (s_n === 3) ? c_n - 1 : c_n;
    state.r_vec[j] = (s_n === 3 &&  c_n === 1) ? [] : state.r_vec[j];
  }
  state.x_dot = state.x_dot.add(state.x_vec.filter((_v, j) => state.c_vec[j] === 1).reduce((a, b) => a.add(b), OpsCost.zero()));
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
  const opcode = p.code[pc];
  const iData = INSTRUCTIONS[opcode];
  const argsRes = new Args;
  const skipBytes = p.mask.skipBytesToNextInstruction(pc);
  const args = decodeArguments(argsRes, iData.kind, p.code, pc + 1, skipBytes);
  const regs = new UsedRegisters;
  REGISTERS[opcode](args, regs);
  return regs;
}

function d_revhat(p: Program, pc: PC): u32 {
  const opcode = p.code[pc];
  const iData = INSTRUCTIONS[opcode];
  // TODO [ToDr] Handle the overlap case!
  return iData.registerCost;
}

function c_revhat(p: Program, pc: PC): u32 {
  const opcode = p.code[pc];
  const iData = INSTRUCTIONS[opcode];
  // TODO [ToDr] handle memory model!
  // TODO [ToDr] handle branch cost!
  if (iData.constantCost === BRANCH_COST) {
    return BRANCH_COST_REGULAR;
  }
  return iData.constantCost === MEMORY_COST ? MEMORY_COST_L2HIT : iData.constantCost;
}

function x_revhat(p: Program, pc: PC): OpsCost {
  const opcode = p.code[pc];
  const iData = INSTRUCTIONS[opcode];
  return iData.opsCost;
}

export function computeGasCosts(p: Program): Map<u32, BlockGasCost> {
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
