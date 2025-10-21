import {portable} from "../portable";
import { dJump, InstructionRun, staticJump } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// JUMP
export const jump: InstructionRun = (r, args) => staticJump(r, args.a);

// JUMP_IND
export const jump_ind: InstructionRun = (r, args, registers) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.b)));
  return dJump(r, address);
};

// LOAD_IMM_JUMP
export const load_imm_jump: InstructionRun = (r, args, registers) => {
  registers[reg(args.a)] = u32SignExtend(args.b);
  return staticJump(r, args.c);
};

// LOAD_IMM_JUMP_IND
export const load_imm_jump_ind: InstructionRun = (r, args, registers) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.d)));
  registers[reg(args.b)] = u32SignExtend(args.c);
  return dJump(r, address);
};
