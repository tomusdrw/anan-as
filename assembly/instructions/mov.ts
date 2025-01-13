import { InstructionRun, ok } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// MOVE_REG
export const move_reg: InstructionRun = (args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)];
  return ok();
};

// CMOV_IZ_IMM
export const cmov_iz_imm: InstructionRun = (args, registers) => {
  if (registers[reg(args.a)] === 0) {
    registers[reg(args.b)] = u32SignExtend(args.c);
  }
  return ok();
};

// CMOV_NZ_IMM
export const cmov_nz_imm: InstructionRun = (args, registers) => {
  if (registers[reg(args.a)] !== 0) {
    registers[reg(args.b)] = u32SignExtend(args.c);
  }
  return ok();
};

// CMOV_IZ
export const cmov_iz: InstructionRun = (args, registers) => {
  if (registers[reg(args.a)] === 0) {
    registers[reg(args.c)] = registers[reg(args.b)];
  }
  return ok();
};

// CMOV_NZ
export const cmov_nz: InstructionRun = (args, registers) => {
  if (registers[reg(args.a)] !== 0) {
    registers[reg(args.c)] = registers[reg(args.b)];
  }
  return ok();
};
