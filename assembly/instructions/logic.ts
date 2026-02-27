import { InstructionRun, ok } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// AND_IMM
export const and_imm: InstructionRun = (r, args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] & u32SignExtend(args.c);
  return ok(r);
};

// XOR_IMM
export const xor_imm: InstructionRun = (r, args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] ^ u32SignExtend(args.c);
  return ok(r);
};

// OR_IMM
export const or_imm: InstructionRun = (r, args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] | u32SignExtend(args.c);
  return ok(r);
};

// AND
export const and: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] & registers[reg(args.a)];
  return ok(r);
};

// XOR
export const xor: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] ^ registers[reg(args.a)];
  return ok(r);
};

// OR
export const or: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] | registers[reg(args.a)];
  return ok(r);
};

// AND_INV
export const and_inv: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] & ~registers[reg(args.a)];
  return ok(r);
};

// OR_INV
export const or_inv: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = u64(registers[reg(args.b)] | ~registers[reg(args.a)]);
  return ok(r);
};

// XNOR
export const xnor: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = u64(~(registers[reg(args.b)] ^ registers[reg(args.a)]));
  return ok(r);
};
