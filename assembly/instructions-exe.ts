import { Args } from "./arguments";
import { OutcomeData, dJump, hostCall, ok, okOrFault, panic, staticJump } from "./instructions-outcome";
import { MAX_SHIFT_32, MAX_SHIFT_64, mulUpperSigned, mulUpperSignedUnsigned, mulUpperUnsigned, reg, u32SignExtend } from "./math";
import { Memory } from "./memory";
import { Registers } from "./registers";

type InstructionRun = (args: Args, registers: Registers, memory: Memory) => OutcomeData;

const INVALID: InstructionRun = () => panic();

export const RUN: InstructionRun[] = [
  // TRAP
  () => panic(),
  // FALLTHROUGH
  () => ok(),
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 10
  // ECALLI
  (args) => hostCall(args.a),
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 20
  // LOAD_IMM_64
  (args, registers) => {
    registers[reg(args.a)] = u64(args.c) + (u64(args.b) << 32);
    return ok();
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 30
  // STORE_IMM_U8
  (args, _registers, memory) => {
    const address = args.a;
    const pageFault = memory.setU8(address, <u8>(args.b & 0xff));
    return okOrFault(pageFault);
  },
  // STORE_IMM_U16
  (args, _registers, memory) => {
    const address = args.a;
    const pageFault = memory.setU16(address, <u16>(args.b & 0xff_ff));
    return okOrFault(pageFault);
  },
  // STORE_IMM_U32
  (args, _registers, memory) => {
    const address = args.a;
    const pageFault = memory.setU32(address, args.b);
    return okOrFault(pageFault);
  },
  // STORE_IMM_U64
  (args, _registers, memory) => {
    const address = args.a;
    const pageFault = memory.setU64(address, u64(args.b));
    return okOrFault(pageFault);
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 40
  // JUMP
  (args) => staticJump(args.a),
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 50
  // JUMP_IND
  (args, registers) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
    return dJump(address);
  },
  // LOAD_IMM
  (args, registers) => {
    registers[reg(args.a)] = u32SignExtend(args.b);
    return ok();
  },
  // LOAD_U8
  (args, registers, memory) => {
    const result = memory.getU8(args.b);
    if (!result.fault.isFault) {
      registers[reg(args.a)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_I8
  (args, registers, memory) => {
    const result = memory.getI8(args.b);
    if (!result.fault.isFault) {
      registers[reg(args.a)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_U16
  (args, registers, memory) => {
    const result = memory.getU16(args.b);
    if (!result.fault.isFault) {
      registers[reg(args.a)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_I16
  (args, registers, memory) => {
    const result = memory.getI16(args.b);
    if (!result.fault.isFault) {
      registers[reg(args.a)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_U32
  (args, registers, memory) => {
    const result = memory.getU32(args.b);
    if (!result.fault.isFault) {
      registers[reg(args.a)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_I32
  (args, registers, memory) => {
    const result = memory.getI32(args.b);
    if (!result.fault.isFault) {
      registers[reg(args.a)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_U64
  (args, registers, memory) => {
    const result = memory.getU64(args.b);
    if (!result.fault.isFault) {
      registers[reg(args.a)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // STORE_U8
  (args, registers, memory) => {
    const fault = memory.setU8(args.b, <u8>(registers[reg(args.a)] & 0xff));
    return okOrFault(fault);
  },

  // 60
  // STORE_U16
  (args, registers, memory) => {
    const fault = memory.setU16(args.b, <u16>(registers[reg(args.a)] & 0xff_ff));
    return okOrFault(fault);
  },
  // STORE_U32
  (args, registers, memory) => {
    const fault = memory.setU32(args.b, u32(registers[reg(args.a)]));
    return okOrFault(fault);
  },
  // STORE_U64
  (args, registers, memory) => {
    const fault = memory.setU64(args.b, registers[reg(args.a)]);
    return okOrFault(fault);
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 70
  // STORE_IMM_IND_U8
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
    const pageFault = memory.setU8(address, <u8>(args.c & 0xff));
    return okOrFault(pageFault);
  },
  // STORE_IMM_IND_U16
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
    const pageFault = memory.setU16(address, <u16>(args.c & 0xff_ff));
    return okOrFault(pageFault);
  },
  // STORE_IMM_IND_U32
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
    const pageFault = memory.setU32(address, args.c);
    return okOrFault(pageFault);
  },
  // STORE_IMM_IND_U64
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.b));
    const pageFault = memory.setU64(address, u32SignExtend(args.c));
    return okOrFault(pageFault);
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 80
  // LOAD_IMM_JUMP
  (args, registers) => {
    registers[reg(args.a)] = u32SignExtend(args.b);
    return staticJump(args.c);
  },
  // BRANCH_EQ_IMM
  (args, registers) => {
    const b = u64(u32SignExtend(args.b));
    if (registers[reg(args.a)] === b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_NE_IMM
  (args, registers) => {
    const b = u64(u32SignExtend(args.b));
    if (registers[reg(args.a)] !== b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_U_IMM
  (args, registers) => {
    const b = u64(u32SignExtend(args.b));
    if (registers[reg(args.a)] < b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LE_U_IMM
  (args, registers) => {
    const b = u64(u32SignExtend(args.b));
    if (registers[reg(args.a)] <= b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GE_U_IMM
  (args, registers) => {
    const b = u64(u32SignExtend(args.b));
    if (registers[reg(args.a)] >= b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GT_U_IMM
  (args, registers) => {
    const b = u64(u32SignExtend(args.b));
    if (registers[reg(args.a)] > b) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_S_IMM
  (args, registers) => {
    if (i64(registers[reg(args.a)]) < u32SignExtend(args.b)) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LE_S_IMM
  (args, registers) => {
    if (i64(registers[reg(args.a)]) <= u32SignExtend(args.b)) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GE_S_IMM
  (args, registers) => {
    if (i64(registers[reg(args.a)]) >= u32SignExtend(args.b)) {
      return staticJump(args.c);
    }
    return ok();
  },

  // 90
  // BRANCH_GT_S_IMM
  (args, registers) => {
    if (i64(registers[reg(args.a)]) > u32SignExtend(args.b)) {
      return staticJump(args.c);
    }
    return ok();
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 100
  // MOVE_REG
  (args, registers) => {
    registers[reg(args.b)] = registers[reg(args.a)];
    return ok();
  },
  // SBRK
  (args, registers, memory) => {
    registers[reg(args.b)] = memory.sbrk(u32(registers[reg(args.a)]));
    return ok();
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 110
  // STORE_IND_U8
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const fault = memory.setU8(address, <u8>(registers[reg(args.b)] & 0xff));
    return okOrFault(fault);
  },
  // STORE_IND_U16
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const fault = memory.setU16(address, <u16>(registers[reg(args.b)] & 0xff_ff));
    return okOrFault(fault);
  },
  // STORE_IND_U32
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const fault = memory.setU32(address, u32(registers[reg(args.b)]));
    return okOrFault(fault);
  },
  // STORE_IND_U64
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const fault = memory.setU64(address, registers[reg(args.b)]);
    return okOrFault(fault);
  },
  // LOAD_IND_U8
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const result = memory.getU8(address);
    if (!result.fault.isFault) {
      registers[reg(args.b)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_I8
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const result = memory.getI8(address);
    if (!result.fault.isFault) {
      registers[reg(args.b)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_U16
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const result = memory.getU16(address);
    if (!result.fault.isFault) {
      registers[reg(args.b)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_I16
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const result = memory.getI16(address);
    if (!result.fault.isFault) {
      registers[reg(args.b)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_U32
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const result = memory.getU32(u32(address));
    if (!result.fault.isFault) {
      registers[reg(args.b)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // LOAD_IND_I32
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const result = memory.getI32(u32(address));
    if (!result.fault.isFault) {
      registers[reg(args.b)] = result.ok;
    }
    return okOrFault(result.fault);
  },

  // 120
  // LOAD_IND_U64
  (args, registers, memory) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.c));
    const result = memory.getU64(u32(address));
    if (!result.fault.isFault) {
      registers[reg(args.b)] = result.ok;
    }
    return okOrFault(result.fault);
  },
  // ADD_IMM_32
  (args, registers) => {
    const a = registers[reg(args.a)];
    const c = u32SignExtend(args.c);
    registers[reg(args.b)] = u32SignExtend(u32(a + c));
    return ok();
  },
  // AND_IMM
  (args, registers) => {
    registers[reg(args.b)] = registers[reg(args.a)] & u32SignExtend(args.c);
    return ok();
  },
  // XOR_IMM
  (args, registers) => {
    registers[reg(args.b)] = registers[reg(args.a)] ^ u32SignExtend(args.c);
    return ok();
  },
  // OR_IMM
  (args, registers) => {
    registers[reg(args.b)] = registers[reg(args.a)] | u32SignExtend(args.c);
    return ok();
  },
  // MUL_IMM_32
  (args, registers) => {
    registers[reg(args.b)] = u32SignExtend(u32(registers[reg(args.a)] * args.c));
    return ok();
  },
  // SET_LT_U_IMM
  (args, registers) => {
    const cond = registers[reg(args.a)] < u64(u32SignExtend(args.c));
    registers[reg(args.b)] = cond ? 1 : 0;
    return ok();
  },
  // SET_LT_S_IMM
  (args, registers) => {
    const cond = i64(registers[reg(args.a)]) < u32SignExtend(args.c);
    registers[reg(args.b)] = cond ? 1 : 0;
    return ok();
  },
  // SHLO_L_IMM_32
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_32);
    const value = u32(registers[reg(args.a)]);
    registers[reg(args.b)] = u32SignExtend(value << shift);
    return ok();
  },
  // SHLO_R_IMM_32
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_32);
    const value = u32(registers[reg(args.a)]);
    registers[reg(args.b)] = u32SignExtend(value >>> shift);
    return ok();
  },

  // 130
  // SHAR_R_IMM_32
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_32);
    const value = u32SignExtend(u32(registers[reg(args.a)]));
    registers[reg(args.b)] = value >> shift;
    return ok();
  },
  // NEG_ADD_IMM_32
  (args, registers) => {
    const sum = (u64(args.c) | 0x1_0000_0000) - registers[reg(args.a)];
    registers[reg(args.b)] = u32SignExtend(u32(sum));
    return ok();
  },
  // SET_GT_U_IMM
  (args, registers) => {
    const cond = registers[reg(args.a)] > u64(u32SignExtend(args.c));
    registers[reg(args.b)] = cond ? 1 : 0;
    return ok();
  },
  // SET_GT_S_IMM
  (args, registers) => {
    const cond = i64(registers[reg(args.a)]) > u32SignExtend(args.c);
    registers[reg(args.b)] = cond ? 1 : 0;
    return ok();
  },
  // SHLO_L_IMM_ALT_32
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
    registers[reg(args.b)] = u32SignExtend(args.c << shift);
    return ok();
  },
  // SHLO_R_IMM_ALT_32
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
    registers[reg(args.b)] = u32SignExtend(args.c >>> shift);
    return ok();
  },
  // SHAR_R_IMM_ALT_32
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
    const imm = u32SignExtend(args.c);
    registers[reg(args.b)] = u32SignExtend(u32(imm >> shift));
    return ok();
  },
  // CMOV_IZ_IMM
  (args, registers) => {
    if (registers[reg(args.a)] === 0) {
      registers[reg(args.b)] = u32SignExtend(args.c);
    }
    return ok();
  },
  // CMOV_NZ_IMM
  (args, registers) => {
    if (registers[reg(args.a)] !== 0) {
      registers[reg(args.b)] = u32SignExtend(args.c);
    }
    return ok();
  },
  // ADD_IMM
  (args, registers) => {
    const sum: u64 = registers[reg(args.a)] + u32SignExtend(args.c);
    registers[reg(args.b)] = sum;
    return ok();
  },

  // 140
  // MUL_IMM
  (args, registers) => {
    registers[reg(args.b)] = registers[reg(args.a)] * u32SignExtend(args.c);
    return ok();
  },
  // SHLO_L_IMM
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_64);
    registers[reg(args.b)] = registers[reg(args.a)] << shift;
    return ok();
  },
  // SHLO_R_IMM
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_64);
    registers[reg(args.b)] = registers[reg(args.a)] >>> shift;
    return ok();
  },
  // SHAR_R_IMM
  (args, registers) => {
    const shift = u32(args.c % MAX_SHIFT_64);
    const value = i64(registers[reg(args.a)]);
    registers[reg(args.b)] = value >> shift;
    return ok();
  },
  // NEG_ADD_IMM
  (args, registers) => {
    const sum = u32SignExtend(args.c) - registers[reg(args.a)];
    registers[reg(args.b)] = sum;
    return ok();
  },
  // SHLO_L_IMM_ALT
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
    registers[reg(args.b)] = u32SignExtend(args.c) << shift;
    return ok();
  },
  // SHLO_R_IMM_ALT
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
    registers[reg(args.b)] = u32SignExtend(args.c) >>> shift;
    return ok();
  },
  // SHAR_R_IMM_ALT
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
    const value = u32SignExtend(args.c);
    registers[reg(args.b)] = u32SignExtend(u32(value >> shift));
    return ok();
  },
  INVALID,
  INVALID,

  // 150
  // BRANCH_EQ
  (args, registers) => {
    if (registers[reg(args.a)] === registers[reg(args.b)]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_NE
  (args, registers) => {
    if (registers[reg(args.a)] !== registers[reg(args.b)]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_U
  (args, registers) => {
    if (registers[reg(args.b)] < registers[reg(args.a)]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_LT_S
  (args, registers) => {
    if (i64(registers[reg(args.b)]) < i64(registers[reg(args.a)])) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GE_U
  (args, registers) => {
    if (registers[reg(args.b)] >= registers[reg(args.a)]) {
      return staticJump(args.c);
    }
    return ok();
  },
  // BRANCH_GE_S
  (args, registers) => {
    if (i64(registers[reg(args.b)]) >= i64(registers[reg(args.a)])) {
      return staticJump(args.c);
    }
    return ok();
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 160
  // LOAD_IMM_JUMP_IND
  (args, registers) => {
    const address = u32(registers[reg(args.a)] + u32SignExtend(args.d));
    registers[reg(args.b)] = u32SignExtend(args.c);
    return dJump(address);
  },
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 170
  // ADD_32
  (args, registers) => {
    registers[reg(args.c)] = u32SignExtend(u32(registers[reg(args.a)]) + u32(registers[reg(args.b)]));
    return ok();
  },
  // SUB_32
  (args, registers) => {
    registers[reg(args.c)] = u32SignExtend(u32(registers[reg(args.b)] + 2 ** 32 - u32(registers[reg(args.a)])));
    return ok();
  },
  // MUL_32
  (args, registers) => {
    registers[reg(args.c)] = u32SignExtend(u32(registers[reg(args.a)] * registers[reg(args.b)]));
    return ok();
  },
  // DIV_U_32
  (args, registers) => {
    const a = u32(registers[reg(args.a)]);
    if (a === 0) {
      registers[reg(args.c)] = u64.MAX_VALUE;
    } else {
      const b = u32(registers[reg(args.b)]);
      registers[reg(args.c)] = u32SignExtend(b / a);
    }
    return ok();
  },
  // DIV_S_32
  (args, registers) => {
    const b = u32SignExtend(u32(registers[reg(args.b)]));
    const a = u32SignExtend(u32(registers[reg(args.a)]));
    if (a === 0) {
      registers[reg(args.c)] = u64.MAX_VALUE;
    } else if (a === -1 && b === i32.MIN_VALUE) {
      registers[reg(args.c)] = b;
    } else {
      registers[reg(args.c)] = b / a;
    }
    return ok();
  },
  // REM_U_32
  (args, registers) => {
    const a = u32(registers[reg(args.a)]);
    const b = u32(registers[reg(args.b)]);
    if (a === 0) {
      registers[reg(args.c)] = u32SignExtend(b);
    } else {
      registers[reg(args.c)] = u32SignExtend(b % a);
    }
    return ok();
  },
  // REM_S_32
  (args, registers) => {
    const b = i32(registers[reg(args.b)]);
    const a = i32(registers[reg(args.a)]);
    if (a === 0) {
      registers[reg(args.c)] = i64(b);
    } else if (a === -1 && b === i32.MIN_VALUE) {
      registers[reg(args.c)] = 0;
    } else {
      registers[reg(args.c)] = i64(b) % i64(a);
    }
    return ok();
  },
  // SHLO_L_32
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
    const value = u32(registers[reg(args.b)]);
    registers[reg(args.c)] = u32SignExtend(value << shift);
    return ok();
  },
  // SHLO_R_32
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
    const value = u32(registers[reg(args.b)]);
    registers[reg(args.c)] = u32SignExtend(value >>> shift);
    return ok();
  },
  // SHAR_R_32
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_32);
    const regValue = u32SignExtend(u32(registers[reg(args.b)]));
    registers[reg(args.c)] = u32SignExtend(u32(regValue >> shift));
    return ok();
  },

  // 180
  // ADD_64
  (args, registers) => {
    registers[reg(args.c)] = registers[reg(args.a)] + registers[reg(args.b)];
    return ok();
  },
  // SUB
  (args, registers) => {
    registers[reg(args.c)] = registers[reg(args.b)] - registers[reg(args.a)];
    return ok();
  },
  // MUL
  (args, registers) => {
    registers[reg(args.c)] = registers[reg(args.a)] * registers[reg(args.b)];
    return ok();
  },
  // DIV_U
  (args, registers) => {
    if (registers[reg(args.a)] === 0) {
      registers[reg(args.c)] = u64.MAX_VALUE;
    } else {
      registers[reg(args.c)] = registers[reg(args.b)] / registers[reg(args.a)];
    }
    return ok();
  },
  // DIV_S
  (args, registers) => {
    const b = i64(registers[reg(args.b)]);
    const a = i64(registers[reg(args.a)]);
    if (a === 0) {
      registers[reg(args.c)] = u64.MAX_VALUE;
    } else if (a === -1 && b === i64.MIN_VALUE) {
      registers[reg(args.c)] = b;
    } else {
      registers[reg(args.c)] = b / a;
    }
    return ok();
  },
  // REM_U
  (args, registers) => {
    if (registers[reg(args.a)] === 0) {
      registers[reg(args.c)] = registers[reg(args.b)];
    } else {
      registers[reg(args.c)] = registers[reg(args.b)] % registers[reg(args.a)];
    }
    return ok();
  },
  // REM_S
  (args, registers) => {
    const b = i64(registers[reg(args.b)]);
    const a = i64(registers[reg(args.a)]);
    if (a === 0) {
      registers[reg(args.c)] = b;
    } else if (a === -1 && b === i64.MIN_VALUE) {
      registers[reg(args.c)] = 0;
    } else {
      registers[reg(args.c)] = b % a;
    }
    return ok();
  },
  // SHLO_L
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
    registers[reg(args.c)] = registers[reg(args.b)] << shift;
    return ok();
  },
  // SHLO_R
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
    registers[reg(args.c)] = registers[reg(args.b)] >>> shift;
    return ok();
  },
  // SHAR_R
  (args, registers) => {
    const shift = u32(registers[reg(args.a)] % MAX_SHIFT_64);
    registers[reg(args.c)] = i64(registers[reg(args.b)]) >> shift;
    return ok();
  },

  // 190
  // AND
  (args, registers) => {
    registers[reg(args.c)] = registers[reg(args.a)] & registers[reg(args.b)];
    return ok();
  },
  // XOR
  (args, registers) => {
    registers[reg(args.c)] = registers[reg(args.a)] ^ registers[reg(args.b)];
    return ok();
  },
  // OR
  (args, registers) => {
    registers[reg(args.c)] = registers[reg(args.a)] | registers[reg(args.b)];
    return ok();
  },
  // MUL_UPPER_S_S
  (args, registers) => {
    registers[reg(args.c)] = mulUpperSigned(
      i64(registers[reg(args.a)]),
      i64(registers[reg(args.b)])
    );
    return ok();
  },
  // MUL_UPPER_U_U
  (args, registers) => {
    registers[reg(args.c)] = mulUpperUnsigned(
      registers[reg(args.a)],
      registers[reg(args.b)]
    );
    return ok();
  },
  // MUL_UPPER_S_U
  (args, registers) => {
    registers[reg(args.c)] = mulUpperSignedUnsigned(
      i64(registers[reg(args.a)]),
      registers[reg(args.b)]
    );
    return ok();
  },
  // SET_LT_U
  (args, registers) => {
    registers[reg(args.c)] = registers[reg(args.b)] < registers[reg(args.a)] ? 1 : 0;
    return ok();
  },
  // SET_LT_S
  (args, registers) => {
    registers[reg(args.c)] = i64(registers[reg(args.b)]) < i64(registers[reg(args.a)]) ? 1 : 0;
    return ok();
  },
  // CMOV_IZ
  (args, registers) => {
    if (registers[reg(args.a)] === 0) {
      registers[reg(args.c)] = registers[reg(args.b)];
    }
    return ok();
  },
  // CMOV_NZ
  (args, registers) => {
    if (registers[reg(args.a)] !== 0) {
      registers[reg(args.c)] = registers[reg(args.b)];
    }
    return ok();
  },
];
