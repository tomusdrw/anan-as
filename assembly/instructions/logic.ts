import { InstructionRun, OutcomeData } from "./outcome";
import { Inst } from "./utils";

// AND_IMM
export const and_imm: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.b)] = registers[Inst.reg(args.a)] & Inst.u32SignExtend(args.c);
  return OutcomeData.ok(r);
};

// XOR_IMM
export const xor_imm: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.b)] = registers[Inst.reg(args.a)] ^ Inst.u32SignExtend(args.c);
  return OutcomeData.ok(r);
};

// OR_IMM
export const or_imm: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.b)] = registers[Inst.reg(args.a)] | Inst.u32SignExtend(args.c);
  return OutcomeData.ok(r);
};

// AND
export const and: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)] & registers[Inst.reg(args.a)];
  return OutcomeData.ok(r);
};

// XOR
export const xor: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)] ^ registers[Inst.reg(args.a)];
  return OutcomeData.ok(r);
};

// OR
export const or: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)] | registers[Inst.reg(args.a)];
  return OutcomeData.ok(r);
};

// AND_INV
export const and_inv: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)] & ~registers[Inst.reg(args.a)];
  return OutcomeData.ok(r);
};

// OR_INV
export const or_inv: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = u64(registers[Inst.reg(args.b)] | ~registers[Inst.reg(args.a)]);
  return OutcomeData.ok(r);
};

// XNOR
export const xnor: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = u64(~(registers[Inst.reg(args.b)] ^ registers[Inst.reg(args.a)]));
  return OutcomeData.ok(r);
};
