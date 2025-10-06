import { dJump, InstructionRun, staticJump } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// JUMP
export const jump: InstructionRun = (args) => staticJump(args.a);

// JUMP_IND
export const jump_ind: InstructionRun = (args, registers) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
  return dJump(address);
};

// LOAD_IMM_JUMP
export const load_imm_jump: InstructionRun = (args, registers) => {
  registers[reg(args.a)] = u32SignExtend(args.b);
  return staticJump(args.c);
};

// LOAD_IMM_JUMP_IND
export const load_imm_jump_ind: InstructionRun = (args, registers) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.d));
  registers[reg(args.b)] = u32SignExtend(args.c);
  return dJump(address);
};
