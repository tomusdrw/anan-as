import { MaybePageFault } from "../memory";
import { InstructionRun, ok, okOrFault } from "./outcome";
import { reg, u32SignExtend } from "./utils";

const faultRes: MaybePageFault = new MaybePageFault();

// LOAD_IMM_64
export const load_imm_64: InstructionRun = (r, args, registers) => {
  registers[reg(args.a)] = u64(args.b) + (u64(args.c) << 32);
  return ok(r);
};

// LOAD_IMM
export const load_imm: InstructionRun = (r, args, registers) => {
  registers[reg(args.a)] = u32SignExtend(args.b);
  return ok(r);
};

// LOAD_U8
export const load_u8: InstructionRun = (r, args, registers, memory) => {
  const result = memory.getU8(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_I8
export const load_i8: InstructionRun = (r, args, registers, memory) => {
  const result = memory.getI8(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_U16
export const load_u16: InstructionRun = (r, args, registers, memory) => {
  const result = memory.getU16(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_I16
export const load_i16: InstructionRun = (r, args, registers, memory) => {
  const result = memory.getI16(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_U32
export const load_u32: InstructionRun = (r, args, registers, memory) => {
  const result = memory.getU32(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_I32
export const load_i32: InstructionRun = (r, args, registers, memory) => {
  const result = memory.getI32(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_U64
export const load_u64: InstructionRun = (r, args, registers, memory) => {
  const result = memory.getU64(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_IND_U8
export const load_ind_u8: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const result = memory.getU8(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_IND_I8
export const load_ind_i8: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const result = memory.getI8(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_IND_U16
export const load_ind_u16: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const result = memory.getU16(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_IND_I16
export const load_ind_i16: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const result = memory.getI16(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_IND_U32
export const load_ind_u32: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const result = memory.getU32(faultRes, u32(address));
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_IND_I32
export const load_ind_i32: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const result = memory.getI32(faultRes, u32(address));
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};

// LOAD_IND_U64
export const load_ind_u64: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const result = memory.getU64(faultRes, u32(address));
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};
