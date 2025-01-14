import { InstructionRun, ok } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// ROT_R_64_IMM
export const rot_r_64_imm: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = math.rot_r(regs[reg(args.a)], args.c);
  return ok();
};

// ROT_R_64_IMM_ALT
export const rot_r_64_imm_alt: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = math.rot_r(args.c, regs[reg(args.a)]);
  return ok();
};

// ROT_R_32_IMM
export const rot_r_32_imm: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = u32SignExtend(math.rot_r_32(u32(regs[reg(args.a)]), u32(args.c)));
  return ok();
};

// ROT_R_32_IMM_ALT
export const rot_r_32_imm_alt: InstructionRun = (args, regs) => {
  regs[reg(args.b)] = u32SignExtend(math.rot_r_32(u32(args.c), u32(regs[reg(args.a)])));
  return ok();
};

// ROT_L_64
export const rot_l_64: InstructionRun = (args, regs) => {
  regs[reg(args.c)] = math.rot_l(regs[reg(args.b)], regs[reg(args.a)]);
  return ok();
};

// ROT_L_32
export const rot_l_32: InstructionRun = (args, regs) => {
  regs[reg(args.c)] = u32SignExtend(math.rot_l_32(u32(regs[reg(args.b)]), u32(regs[reg(args.a)])));
  return ok();
};

// ROT_R_64
export const rot_r_64: InstructionRun = (args, regs) => {
  regs[reg(args.c)] = math.rot_r(regs[reg(args.b)], regs[reg(args.a)]);
  return ok();
};

// ROT_R_32
export const rot_r_32: InstructionRun = (args, regs) => {
  regs[reg(args.c)] = u32SignExtend(math.rot_r_32(u32(regs[reg(args.b)]), u32(regs[reg(args.a)])));
  return ok();
};

export namespace math {
  // @inline
  export function rot_r(v: u64, shift: u64): u64 {
    return rotr<u64>(v, shift);
  }
  // @inline
  export function rot_r_32(v: u32, shift: u32): u32 {
    return rotr<u32>(v, shift);
  }
  // @inline
  export function rot_l(v: u64, shift: u64): u64 {
    return rotl<u64>(v, shift);
  }
  // @inline
  export function rot_l_32(v: u32, shift: u32): u32 {
    return rotl<u32>(v, shift);
  }
}
