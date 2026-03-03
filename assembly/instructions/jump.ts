import { portable } from "../portable";
import { InstructionRun, OutcomeData } from "./outcome";
import { Inst } from "./utils";

// JUMP
export const jump: InstructionRun = (r, args) => OutcomeData.staticJump(r, args.a);

// JUMP_IND
export const jump_ind: InstructionRun = (r, args, registers) => {
  const address = u32(portable.u64_add(registers[Inst.reg(args.a)], Inst.u32SignExtend(args.b)));
  return OutcomeData.dJump(r, address);
};

// LOAD_IMM_JUMP
export const load_imm_jump: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.a)] = Inst.u32SignExtend(args.b);
  return OutcomeData.staticJump(r, args.c);
};

// LOAD_IMM_JUMP_IND
export const load_imm_jump_ind: InstructionRun = (r, args, registers) => {
  const address = u32(portable.u64_add(registers[Inst.reg(args.a)], Inst.u32SignExtend(args.d)));
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(args.c);
  return OutcomeData.dJump(r, address);
};
