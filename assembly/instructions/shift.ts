import { InstructionRun, OutcomeData } from "./outcome";
import { Inst } from "./utils";

const MAX_SHIFT_64 = 64;
const MAX_SHIFT_32 = 32;

// SHLO_L_IMM_32
export const shlo_l_imm_32: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_32);
  const value = u32(registers[Inst.reg(args.a)]);
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(value << shift);
  return OutcomeData.ok(r);
};

// SHLO_R_IMM_32
export const shlo_r_imm_32: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_32);
  const value = u32(registers[Inst.reg(args.a)]);
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(value >>> shift);
  return OutcomeData.ok(r);
};

// SHAR_R_IMM_32
export const shar_r_imm_32: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_32);
  const value = Inst.u32SignExtend(u32(registers[Inst.reg(args.a)]));
  registers[Inst.reg(args.b)] = u64(i64(value) >> i64(shift));
  return OutcomeData.ok(r);
};

// SHLO_L_IMM_ALT_32
export const shlo_l_imm_alt_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_32));
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(args.c << shift);
  return OutcomeData.ok(r);
};

// SHLO_R_IMM_ALT_32
export const shlo_r_imm_alt_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_32));
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(args.c >>> shift);
  return OutcomeData.ok(r);
};

// SHAR_R_IMM_ALT_32
export const shar_r_imm_alt_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_32));
  const imm = Inst.u32SignExtend(args.c);
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(u32(i64(imm) >> i64(shift)));
  return OutcomeData.ok(r);
};

// SHLO_L_IMM
export const shlo_l_imm: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_64);
  registers[Inst.reg(args.b)] = u64(registers[Inst.reg(args.a)] << u64(shift));
  return OutcomeData.ok(r);
};

// SHLO_R_IMM
export const shlo_r_imm: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_64);
  registers[Inst.reg(args.b)] = registers[Inst.reg(args.a)] >> u64(shift);
  return OutcomeData.ok(r);
};

// SHAR_R_IMM
export const shar_r_imm: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_64);
  const value = i64(registers[Inst.reg(args.a)]);
  registers[Inst.reg(args.b)] = u64(value >> i64(shift));
  return OutcomeData.ok(r);
};

// SHLO_L_IMM_ALT
export const shlo_l_imm_alt: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_64));
  registers[Inst.reg(args.b)] = u64(Inst.u32SignExtend(args.c) << i64(shift));
  return OutcomeData.ok(r);
};

// SHLO_R_IMM_ALT
export const shlo_r_imm_alt: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_64));
  registers[Inst.reg(args.b)] = u64(Inst.u32SignExtend(args.c)) >> u64(shift);
  return OutcomeData.ok(r);
};

// SHAR_R_IMM_ALT
export const shar_r_imm_alt: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_64));
  const value = Inst.u32SignExtend(args.c);
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(u32(value >> i64(shift)));
  return OutcomeData.ok(r);
};

// SHLO_L_32
export const shlo_l_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_32));
  const value = u32(registers[Inst.reg(args.b)]);
  registers[Inst.reg(args.c)] = Inst.u32SignExtend(value << shift);
  return OutcomeData.ok(r);
};

// SHLO_R_32
export const shlo_r_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_32));
  const value = u32(registers[Inst.reg(args.b)]);
  registers[Inst.reg(args.c)] = Inst.u32SignExtend(value >>> shift);
  return OutcomeData.ok(r);
};

// SHAR_R_32
export const shar_r_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_32));
  const regValue = Inst.u32SignExtend(u32(registers[Inst.reg(args.b)]));
  registers[Inst.reg(args.c)] = Inst.u32SignExtend(u32(i64(regValue) >> i64(shift)));
  return OutcomeData.ok(r);
};

// SHLO_L
export const shlo_l: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_64));
  registers[Inst.reg(args.c)] = u64(registers[Inst.reg(args.b)] << u64(shift));
  return OutcomeData.ok(r);
};

// SHLO_R
export const shlo_r: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_64));
  registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)] >> u64(shift);
  return OutcomeData.ok(r);
};

// SHAR_R
export const shar_r: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[Inst.reg(args.a)] % u64(MAX_SHIFT_64));
  registers[Inst.reg(args.c)] = u64(i64(registers[Inst.reg(args.b)]) >> i64(shift));
  return OutcomeData.ok(r);
};
