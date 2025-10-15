import { InstructionRun, ok } from "./outcome";
import { reg, u32SignExtend } from "./utils";

const MAX_SHIFT_64 = 64;
const MAX_SHIFT_32 = 32;

// SHLO_L_IMM_32
export const shlo_l_imm_32: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_32);
  const value = u32(registers[reg(args.a)]);
  registers[reg(args.b)] = u32SignExtend(value << shift);
  return ok(r);
};

// SHLO_R_IMM_32
export const shlo_r_imm_32: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_32);
  const value = u32(registers[reg(args.a)]);
  registers[reg(args.b)] = u32SignExtend(value >>> shift);
  return ok(r);
};

// SHAR_R_IMM_32
export const shar_r_imm_32: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_32);
  const value = u32SignExtend(u32(registers[reg(args.a)]));
  registers[reg(args.b)] = value >> shift;
  return ok(r);
};

// SHLO_L_IMM_ALT_32
export const shlo_l_imm_alt_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
  registers[reg(args.b)] = u32SignExtend(args.c << shift);
  return ok(r);
};

// SHLO_R_IMM_ALT_32
export const shlo_r_imm_alt_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
  registers[reg(args.b)] = u32SignExtend(args.c >>> shift);
  return ok(r);
};

// SHAR_R_IMM_ALT_32
export const shar_r_imm_alt_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
  const imm = u32SignExtend(args.c);
  registers[reg(args.b)] = u32SignExtend(u32(imm >> shift));
  return ok(r);
};

// SHLO_L_IMM
export const shlo_l_imm: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_64);
  registers[reg(args.b)] = registers[reg(args.a)] << shift;
  return ok(r);
};

// SHLO_R_IMM
export const shlo_r_imm: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_64);
  registers[reg(args.b)] = registers[reg(args.a)] >>> shift;
  return ok(r);
};

// SHAR_R_IMM
export const shar_r_imm: InstructionRun = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_64);
  const value = i64(registers[reg(args.a)]);
  registers[reg(args.b)] = value >> shift;
  return ok(r);
};

// SHLO_L_IMM_ALT
export const shlo_l_imm_alt: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
  registers[reg(args.b)] = u32SignExtend(args.c) << shift;
  return ok(r);
};

// SHLO_R_IMM_ALT
export const shlo_r_imm_alt: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
  registers[reg(args.b)] = u32SignExtend(args.c) >>> shift;
  return ok(r);
};

// SHAR_R_IMM_ALT
export const shar_r_imm_alt: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
  const value = u32SignExtend(args.c);
  registers[reg(args.b)] = u32SignExtend(u32(value >> shift));
  return ok(r);
};

// SHLO_L_32
export const shlo_l_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
  const value = u32(registers[reg(args.b)]);
  registers[reg(args.c)] = u32SignExtend(value << shift);
  return ok(r);
};

// SHLO_R_32
export const shlo_r_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
  const value = u32(registers[reg(args.b)]);
  registers[reg(args.c)] = u32SignExtend(value >>> shift);
  return ok(r);
};

// SHAR_R_32
export const shar_r_32: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
  const regValue = u32SignExtend(u32(registers[reg(args.b)]));
  registers[reg(args.c)] = u32SignExtend(u32(regValue >> shift));
  return ok(r);
};

// SHLO_L
export const shlo_l: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
  registers[reg(args.c)] = registers[reg(args.b)] << shift;
  return ok(r);
};

// SHLO_R
export const shlo_r: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
  registers[reg(args.c)] = registers[reg(args.b)] >>> shift;
  return ok(r);
};

// SHAR_R
export const shar_r: InstructionRun = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
  registers[reg(args.c)] = i64(registers[reg(args.b)]) >> shift;
  return ok(r);
};
