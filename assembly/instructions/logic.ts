import { InstructionRun, ok } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// AND_IMM
export const and_imm: InstructionRun = (args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] & u32SignExtend(args.c);
  return ok();
};

// XOR_IMM
export const xor_imm: InstructionRun = (args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] ^ u32SignExtend(args.c);
  return ok();
};

// OR_IMM
export const or_imm: InstructionRun = (args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] | u32SignExtend(args.c);
  return ok();
};

// AND
export const and: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.a)] & registers[reg(args.b)];
  return ok();
};

// XOR
export const xor: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.a)] ^ registers[reg(args.b)];
  return ok();
};

// OR
export const or: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.a)] | registers[reg(args.b)];
  return ok();
};

// AND_INV
export const and_inv: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.a)] & registers[reg(args.b)];
  return ok();
};

// OR_INV
export const or_inv: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.a)] | registers[reg(args.b)];
  return ok();
};

// XNOR
export const xnor: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.a)] ^ registers[reg(args.b)];
  return ok();
};
