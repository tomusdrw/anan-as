import { InstructionRun, OutcomeData } from "./outcome";
import { Inst } from "./utils";

// BRANCH_EQ_IMM
export const branch_eq_imm: InstructionRun = (r, args, registers) => {
  const b = u64(Inst.u32SignExtend(args.b));
  if (registers[Inst.reg(args.a)] === b) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_NE_IMM
export const branch_ne_imm: InstructionRun = (r, args, registers) => {
  const b = u64(Inst.u32SignExtend(args.b));
  if (registers[Inst.reg(args.a)] !== b) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_LT_U_IMM
export const branch_lt_u_imm: InstructionRun = (r, args, registers) => {
  const b = u64(Inst.u32SignExtend(args.b));
  if (registers[Inst.reg(args.a)] < b) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_LE_U_IMM
export const branch_le_u_imm: InstructionRun = (r, args, registers) => {
  const b = u64(Inst.u32SignExtend(args.b));
  if (registers[Inst.reg(args.a)] <= b) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_GE_U_IMM
export const branch_ge_u_imm: InstructionRun = (r, args, registers) => {
  const b = u64(Inst.u32SignExtend(args.b));
  if (registers[Inst.reg(args.a)] >= b) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_GT_U_IMM
export const branch_gt_u_imm: InstructionRun = (r, args, registers) => {
  const b = u64(Inst.u32SignExtend(args.b));
  if (registers[Inst.reg(args.a)] > b) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_LT_S_IMM
export const branch_lt_s_imm: InstructionRun = (r, args, registers) => {
  if (i64(registers[Inst.reg(args.a)]) < i64(Inst.u32SignExtend(args.b))) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_LE_S_IMM
export const branch_le_s_imm: InstructionRun = (r, args, registers) => {
  if (i64(registers[Inst.reg(args.a)]) <= i64(Inst.u32SignExtend(args.b))) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_GE_S_IMM
export const branch_ge_s_imm: InstructionRun = (r, args, registers) => {
  if (i64(registers[Inst.reg(args.a)]) >= i64(Inst.u32SignExtend(args.b))) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_GT_S_IMM
export const branch_gt_s_imm: InstructionRun = (r, args, registers) => {
  if (i64(registers[Inst.reg(args.a)]) > i64(Inst.u32SignExtend(args.b))) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_EQ
export const branch_eq: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.a)] === registers[Inst.reg(args.b)]) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_NE
export const branch_ne: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.a)] !== registers[Inst.reg(args.b)]) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_LT_U
export const branch_lt_u: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.b)] < registers[Inst.reg(args.a)]) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_LT_S
export const branch_lt_s: InstructionRun = (r, args, registers) => {
  if (i64(registers[Inst.reg(args.b)]) < i64(registers[Inst.reg(args.a)])) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_GE_U
export const branch_ge_u: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.b)] >= registers[Inst.reg(args.a)]) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};

// BRANCH_GE_S
export const branch_ge_s: InstructionRun = (r, args, registers) => {
  if (i64(registers[Inst.reg(args.b)]) >= i64(registers[Inst.reg(args.a)])) {
    return OutcomeData.staticJump(r, args.c);
  }
  return OutcomeData.ok(r);
};
