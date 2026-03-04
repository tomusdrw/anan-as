import { InstructionRun, OutcomeData } from "./outcome";
import { Inst } from "./utils";

// MOVE_REG
export const move_reg: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.b)] = registers[Inst.reg(args.a)];
  return OutcomeData.ok(r);
};

// CMOV_IZ_IMM
export const cmov_iz_imm: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.a)] === u64(0)) {
    registers[Inst.reg(args.b)] = Inst.u32SignExtend(args.c);
  }
  return OutcomeData.ok(r);
};

// CMOV_NZ_IMM
export const cmov_nz_imm: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.a)] !== u64(0)) {
    registers[Inst.reg(args.b)] = Inst.u32SignExtend(args.c);
  }
  return OutcomeData.ok(r);
};

// CMOV_IZ
export const cmov_iz: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.a)] === u64(0)) {
    registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)];
  }
  return OutcomeData.ok(r);
};

// CMOV_NZ
export const cmov_nz: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.a)] !== u64(0)) {
    registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)];
  }
  return OutcomeData.ok(r);
};
