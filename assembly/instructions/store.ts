import { MaybePageFault } from "../memory";
import { InstructionRun, okOrFault } from "./outcome";
import { reg, u32SignExtend } from "./utils";

const faultRes = new MaybePageFault();

// STORE_IMM_U8
export const store_imm_u8: InstructionRun = (r, args, _registers, memory) => {
  const address = args.a;
  memory.setU8(faultRes, address, u8(args.b & 0xff));
  return okOrFault(r, faultRes);
};

// STORE_IMM_U16
export const store_imm_u16: InstructionRun = (r, args, _registers, memory) => {
  const address = args.a;
  memory.setU16(faultRes, address, u16(args.b & 0xff_ff));
  return okOrFault(r, faultRes);
};

// STORE_IMM_U32
export const store_imm_u32: InstructionRun = (r, args, _registers, memory) => {
  const address = args.a;
  memory.setU32(faultRes, address, args.b);
  return okOrFault(r, faultRes);
};

// STORE_IMM_U64
export const store_imm_u64: InstructionRun = (r, args, _registers, memory) => {
  const address = args.a;
  memory.setU64(faultRes, address, u32SignExtend(args.b));
  return okOrFault(r, faultRes);
};

// STORE_U8
export const store_u8: InstructionRun = (r, args, registers, memory) => {
  memory.setU8(faultRes, args.b, u8(registers[reg(args.a)] & u64(0xff)));
  return okOrFault(r, faultRes);
};

// STORE_U16
export const store_u16: InstructionRun = (r, args, registers, memory) => {
  memory.setU16(faultRes, args.b, u16(registers[reg(args.a)] & u64(0xff_ff)));
  return okOrFault(r, faultRes);
};

// STORE_U32
export const store_u32: InstructionRun = (r, args, registers, memory) => {
  memory.setU32(faultRes, args.b, u32(registers[reg(args.a)]));
  return okOrFault(r, faultRes);
};

// STORE_U64
export const store_u64: InstructionRun = (r, args, registers, memory) => {
  memory.setU64(faultRes, args.b, registers[reg(args.a)]);
  return okOrFault(r, faultRes);
};

// STORE_IMM_IND_U8
export const store_imm_ind_u8: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
  memory.setU8(faultRes, address, u8(args.c & 0xff));
  return okOrFault(r, faultRes);
};

// STORE_IMM_IND_U16
export const store_imm_ind_u16: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
  memory.setU16(faultRes, address, u16(args.c & 0xff_ff));
  return okOrFault(r, faultRes);
};

// STORE_IMM_IND_U32
export const store_imm_ind_u32: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
  memory.setU32(faultRes, address, args.c);
  return okOrFault(r, faultRes);
};

// STORE_IMM_IND_U64
export const store_imm_ind_u64: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
  memory.setU64(faultRes, address, u32SignExtend(args.c));
  return okOrFault(r, faultRes);
};

// STORE_IND_U8
export const store_ind_u8: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  memory.setU8(faultRes, address, u8(registers[reg(args.b)] & u64(0xff)));
  return okOrFault(r, faultRes);
};

// STORE_IND_U16
export const store_ind_u16: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  memory.setU16(faultRes, address, u16(registers[reg(args.b)] & u64(0xff_ff)));
  return okOrFault(r, faultRes);
};

// STORE_IND_U32
export const store_ind_u32: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  memory.setU32(faultRes, address, u32(registers[reg(args.b)]));
  return okOrFault(r, faultRes);
};

// STORE_IND_U64
export const store_ind_u64: InstructionRun = (r, args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  memory.setU64(faultRes, address, registers[reg(args.b)]);
  return okOrFault(r, faultRes);
};
