import { InstructionRun, ok } from "./outcome";
import { reg, u8SignExtend, u16SignExtend } from "./utils";

// COUNT_SET_BITS_64
export const count_set_bits_64: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = popcnt<u64>(regs[reg(args.a)]);
  return ok();
};

// COUNT_SET_BITS_32
export const count_set_bits_32: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = popcnt<u32>(u32(regs[reg(args.a)]));
  return ok();
};

// LEADING_ZERO_BITS_64
export const leading_zero_bits_64: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = clz<u64>(regs[reg(args.a)]);
  return ok();
};

// LEADING_ZERO_BITS_32
export const leading_zero_bits_32: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = clz<u32>(u32(regs[reg(args.a)]));
  return ok();
};

// TRAILING_ZERO_BITS_64
export const trailing_zero_bits_64: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = ctz<u64>(regs[reg(args.a)]);
  return ok();
};

// TRAILING_ZERO_BITS_32
export const trailing_zero_bits_32: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = ctz<u32>(u32(regs[reg(args.a)]));
  return ok();
};

// SIGN_EXTEND_8
export const sign_extend_8: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = u8SignExtend(u8(regs[reg(args.a)]));
  return ok();
};

// SIGN_EXTEND_16
export const sign_extend_16: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = u16SignExtend(u16(regs[reg(args.a)]));
  return ok();
};

// ZERO_EXTEND_16
export const zero_extend_16: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = u64(u16(regs[reg(args.a)]));
  return ok();
};

// REVERSE_BYTES
export const reverse_bytes: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = bswap<u64>(regs[reg(args.a)]);
  return ok();
};
