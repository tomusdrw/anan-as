import { InstructionRun, okOrFault } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// STORE_IMM_U8
export const store_imm_u8: InstructionRun = (args, _registers, memory) => {
  const address = args.a;
  const pageFault = memory.setU8(address, <u8>(args.b & 0xff));
  return okOrFault(pageFault);
};

// STORE_IMM_U16
export const store_imm_u16: InstructionRun = (args, _registers, memory) => {
  const address = args.a;
  const pageFault = memory.setU16(address, <u16>(args.b & 0xff_ff));
  return okOrFault(pageFault);
};

// STORE_IMM_U32
export const store_imm_u32: InstructionRun = (args, _registers, memory) => {
  const address = args.a;
  const pageFault = memory.setU32(address, args.b);
  return okOrFault(pageFault);
};

// STORE_IMM_U64
export const store_imm_u64: InstructionRun = (args, _registers, memory) => {
  const address = args.a;
  const pageFault = memory.setU64(address, u32SignExtend(args.b));
  return okOrFault(pageFault);
};

// STORE_U8
export const store_u8: InstructionRun = (args, registers, memory) => {
  const fault = memory.setU8(args.b, <u8>(registers[reg(args.a)] & 0xff));
  return okOrFault(fault);
};

// STORE_U16
export const store_u16: InstructionRun = (args, registers, memory) => {
  const fault = memory.setU16(args.b, <u16>(registers[reg(args.a)] & 0xff_ff));
  return okOrFault(fault);
};

// STORE_U32
export const store_u32: InstructionRun = (args, registers, memory) => {
  const fault = memory.setU32(args.b, u32(registers[reg(args.a)]));
  return okOrFault(fault);
};

// STORE_U64
export const store_u64: InstructionRun = (args, registers, memory) => {
  const fault = memory.setU64(args.b, registers[reg(args.a)]);
  return okOrFault(fault);
};

// STORE_IMM_IND_U8
export const store_imm_ind_u8: InstructionRun = (args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
  const pageFault = memory.setU8(address, <u8>(args.c & 0xff));
  return okOrFault(pageFault);
};

// STORE_IMM_IND_U16
export const store_imm_ind_u16: InstructionRun = (args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
  const pageFault = memory.setU16(address, <u16>(args.c & 0xff_ff));
  return okOrFault(pageFault);
};

// STORE_IMM_IND_U32
export const store_imm_ind_u32: InstructionRun = (args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
  const pageFault = memory.setU32(address, args.c);
  return okOrFault(pageFault);
};

// STORE_IMM_IND_U64
export const store_imm_ind_u64: InstructionRun = (args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
  const pageFault = memory.setU64(address, u32SignExtend(args.c));
  return okOrFault(pageFault);
};

// STORE_IND_U8
export const store_ind_u8: InstructionRun = (args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const fault = memory.setU8(address, <u8>(registers[reg(args.b)] & 0xff));
  return okOrFault(fault);
};

// STORE_IND_U16
export const store_ind_u16: InstructionRun = (args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const fault = memory.setU16(address, <u16>(registers[reg(args.b)] & 0xff_ff));
  return okOrFault(fault);
};

// STORE_IND_U32
export const store_ind_u32: InstructionRun = (args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const fault = memory.setU32(address, u32(registers[reg(args.b)]));
  return okOrFault(fault);
};

// STORE_IND_U64
export const store_ind_u64: InstructionRun = (args, registers, memory) => {
  const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
  const fault = memory.setU64(address, registers[reg(args.b)]);
  return okOrFault(fault);
};
