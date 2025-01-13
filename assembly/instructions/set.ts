import { InstructionRun, ok } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// SET_LT_U_IMM
export const set_lt_u_imm: InstructionRun = (args, registers) => {
  const cond = registers[reg(args.a)] < u64(u32SignExtend(args.c));
  registers[reg(args.b)] = cond ? 1 : 0;
  return ok();
};

// SET_LT_S_IMM
export const set_lt_s_imm: InstructionRun = (args, registers) => {
  const cond = i64(registers[reg(args.a)]) < u32SignExtend(args.c);
  registers[reg(args.b)] = cond ? 1 : 0;
  return ok();
};

// SET_GT_U_IMM
export const set_gt_u_imm: InstructionRun = (args, registers) => {
  const cond = registers[reg(args.a)] > u64(u32SignExtend(args.c));
  registers[reg(args.b)] = cond ? 1 : 0;
  return ok();
};

// SET_GT_S_IMM
export const set_gt_s_imm: InstructionRun = (args, registers) => {
  const cond = i64(registers[reg(args.a)]) > u32SignExtend(args.c);
  registers[reg(args.b)] = cond ? 1 : 0;
  return ok();
};

// SET_LT_U
export const set_lt_u: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] < registers[reg(args.a)] ? 1 : 0;
  return ok();
};

// SET_LT_S
export const set_lt_s: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = i64(registers[reg(args.b)]) < i64(registers[reg(args.a)]) ? 1 : 0;
  return ok();
};
