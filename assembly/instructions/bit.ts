import { portable } from "../portable";
import { InstructionRun, ok } from "./outcome";
import { reg, u8SignExtend, u16SignExtend } from "./utils";

// COUNT_SET_BITS_64
export const count_set_bits_64: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = portable.popcnt_u64(regs[reg(args.a)]);
  return ok(r);
};

// COUNT_SET_BITS_32
export const count_set_bits_32: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = portable.popcnt_u32(u32(regs[reg(args.a)]));
  return ok(r);
};

// LEADING_ZERO_BITS_64
export const leading_zero_bits_64: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = portable.clz_u64(regs[reg(args.a)]);
  return ok(r);
};

// LEADING_ZERO_BITS_32
export const leading_zero_bits_32: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = portable.clz_u32(u32(regs[reg(args.a)]));
  return ok(r);
};

// TRAILING_ZERO_BITS_64
export const trailing_zero_bits_64: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = portable.ctz_u64(regs[reg(args.a)]);
  return ok(r);
};

// TRAILING_ZERO_BITS_32
export const trailing_zero_bits_32: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = portable.ctz_u32(u32(regs[reg(args.a)]));
  return ok(r);
};

// SIGN_EXTEND_8
export const sign_extend_8: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = u8SignExtend(u8(regs[reg(args.a)]));
  return ok(r);
};

// SIGN_EXTEND_16
export const sign_extend_16: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = u16SignExtend(u16(regs[reg(args.a)]));
  return ok(r);
};

// ZERO_EXTEND_16
export const zero_extend_16: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = u64(u16(regs[reg(args.a)]));
  return ok(r);
};

// REVERSE_BYTES
export const reverse_bytes: InstructionRun = (r, args, regs) => {
  regs[reg(args.b)] = portable.bswap_u64(regs[reg(args.a)]);
  return ok(r);
};
