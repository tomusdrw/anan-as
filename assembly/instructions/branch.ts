import { InstructionRun, ok, staticJump } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// BRANCH_EQ_IMM
export const branch_eq_imm: InstructionRun = (args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] === b) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_NE_IMM
export const branch_ne_imm: InstructionRun = (args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] !== b) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_LT_U_IMM
export const branch_lt_u_imm: InstructionRun = (args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] < b) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_LE_U_IMM
export const branch_le_u_imm: InstructionRun = (args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] <= b) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_GE_U_IMM
export const branch_ge_u_imm: InstructionRun = (args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] >= b) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_GT_U_IMM
export const branch_gt_u_imm: InstructionRun = (args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] > b) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_LT_S_IMM
export const branch_lt_s_imm: InstructionRun = (args, registers) => {
  if (i64(registers[reg(args.a)]) < u32SignExtend(args.b)) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_LE_S_IMM
export const branch_le_s_imm: InstructionRun = (args, registers) => {
  if (i64(registers[reg(args.a)]) <= u32SignExtend(args.b)) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_GE_S_IMM
export const branch_ge_s_imm: InstructionRun = (args, registers) => {
  if (i64(registers[reg(args.a)]) >= u32SignExtend(args.b)) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_GT_S_IMM
export const branch_gt_s_imm: InstructionRun = (args, registers) => {
  if (i64(registers[reg(args.a)]) > u32SignExtend(args.b)) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_EQ
export const branch_eq: InstructionRun = (args, registers) => {
  if (registers[reg(args.a)] === registers[reg(args.b)]) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_NE
export const branch_ne: InstructionRun = (args, registers) => {
  if (registers[reg(args.a)] !== registers[reg(args.b)]) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_LT_U
export const branch_lt_u: InstructionRun = (args, registers) => {
  if (registers[reg(args.b)] < registers[reg(args.a)]) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_LT_S
export const branch_lt_s: InstructionRun = (args, registers) => {
  if (i64(registers[reg(args.b)]) < i64(registers[reg(args.a)])) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_GE_U
export const branch_ge_u: InstructionRun = (args, registers) => {
  if (registers[reg(args.b)] >= registers[reg(args.a)]) {
    return staticJump(args.c);
  }
  return ok();
};

// BRANCH_GE_S
export const branch_ge_s: InstructionRun = (args, registers) => {
  if (i64(registers[reg(args.b)]) >= i64(registers[reg(args.a)])) {
    return staticJump(args.c);
  }
  return ok();
};
