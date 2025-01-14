import { InstructionRun, ok } from "./outcome";
import { mulUpperSigned, mulUpperSignedUnsigned, mulUpperUnsigned, reg, u32SignExtend } from "./utils";

// ADD_IMM_32
export const add_imm_32: InstructionRun = (args, registers) => {
  const a = registers[reg(args.a)];
  const c = u32SignExtend(args.c);
  registers[reg(args.b)] = u32SignExtend(u32(a + c));
  return ok();
};

// MUL_IMM_32
export const mul_imm_32: InstructionRun = (args, registers) => {
  registers[reg(args.b)] = u32SignExtend(u32(registers[reg(args.a)] * args.c));
  return ok();
};

// NEG_ADD_IMM_32
export const neg_add_imm_32: InstructionRun = (args, registers) => {
  const sum = (u64(args.c) | 0x1_0000_0000) - registers[reg(args.a)];
  registers[reg(args.b)] = u32SignExtend(u32(sum));
  return ok();
};

// ADD_IMM
export const add_imm: InstructionRun = (args, registers) => {
  const sum: u64 = registers[reg(args.a)] + u32SignExtend(args.c);
  registers[reg(args.b)] = sum;
  return ok();
};

// MUL_IMM
export const mul_imm: InstructionRun = (args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] * u32SignExtend(args.c);
  return ok();
};

// NEG_ADD_IMM
export const neg_add_imm: InstructionRun = (args, registers) => {
  const sum = u32SignExtend(args.c) - registers[reg(args.a)];
  registers[reg(args.b)] = sum;
  return ok();
};

// ADD_32
export const add_32: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = u32SignExtend(u32(registers[reg(args.a)]) + u32(registers[reg(args.b)]));
  return ok();
};

// SUB_32
export const sub_32: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = u32SignExtend(u32(registers[reg(args.b)] + 2 ** 32 - u32(registers[reg(args.a)])));
  return ok();
};

// MUL_32
export const mul_32: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = u32SignExtend(u32(registers[reg(args.a)] * registers[reg(args.b)]));
  return ok();
};

// DIV_U_32
export const div_u_32: InstructionRun = (args, registers) => {
  const a = u32(registers[reg(args.a)]);
  if (a === 0) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else {
    const b = u32(registers[reg(args.b)]);
    registers[reg(args.c)] = u32SignExtend(b / a);
  }
  return ok();
};

// DIV_S_32
export const div_s_32: InstructionRun = (args, registers) => {
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
};

// REM_U_32
export const rem_u_32: InstructionRun = (args, registers) => {
  const a = u32(registers[reg(args.a)]);
  const b = u32(registers[reg(args.b)]);
  if (a === 0) {
    registers[reg(args.c)] = u32SignExtend(b);
  } else {
    registers[reg(args.c)] = u32SignExtend(b % a);
  }
  return ok();
};

// REM_S_32
export const rem_s_32: InstructionRun = (args, registers) => {
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
};

// ADD_64
export const add_64: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.a)] + registers[reg(args.b)];
  return ok();
};

// SUB
export const sub: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] - registers[reg(args.a)];
  return ok();
};

// MUL
export const mul: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = registers[reg(args.a)] * registers[reg(args.b)];
  return ok();
};

// DIV_U
export const div_u: InstructionRun = (args, registers) => {
  if (registers[reg(args.a)] === 0) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else {
    registers[reg(args.c)] = registers[reg(args.b)] / registers[reg(args.a)];
  }
  return ok();
};

// DIV_S
export const div_s: InstructionRun = (args, registers) => {
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
};

// REM_U
export const rem_u: InstructionRun = (args, registers) => {
  if (registers[reg(args.a)] === 0) {
    registers[reg(args.c)] = registers[reg(args.b)];
  } else {
    registers[reg(args.c)] = registers[reg(args.b)] % registers[reg(args.a)];
  }
  return ok();
};

// REM_S
export const rem_s: InstructionRun = (args, registers) => {
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
};

// MUL_UPPER_S_S
export const mul_upper_s_s: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = mulUpperSigned(i64(registers[reg(args.a)]), i64(registers[reg(args.b)]));
  return ok();
};

// MUL_UPPER_U_U
export const mul_upper_u_u: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = mulUpperUnsigned(registers[reg(args.a)], registers[reg(args.b)]);
  return ok();
};

// MUL_UPPER_S_U
export const mul_upper_s_u: InstructionRun = (args, registers) => {
  registers[reg(args.c)] = mulUpperSignedUnsigned(i64(registers[reg(args.a)]), registers[reg(args.b)]);
  return ok();
};

// MAX
export const max: InstructionRun = (args, registers) => {
  const a = i64(registers[reg(args.a)]);
  const b = i64(registers[reg(args.b)]);
  registers[reg(args.c)] = a < b ? b : a;
  return ok();
};

// MAX_U
export const max_u: InstructionRun = (args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = a < b ? b : a;
  return ok();
};

// MIN
export const min: InstructionRun = (args, registers) => {
  const a = i64(registers[reg(args.a)]);
  const b = i64(registers[reg(args.b)]);
  registers[reg(args.c)] = a > b ? b : a;
  return ok();
};

// MIN_U
export const min_u: InstructionRun = (args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = a > b ? b : a;
  return ok();
};
