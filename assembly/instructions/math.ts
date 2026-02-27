import { portable } from "../portable";
import { InstructionRun, ok } from "./outcome";
import { mulUpperSigned, mulUpperSignedUnsigned, mulUpperUnsigned, reg, u32SignExtend } from "./utils";

// ADD_IMM_32
export const add_imm_32: InstructionRun = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const c = u32SignExtend(args.c);
  registers[reg(args.b)] = u32SignExtend(u32(portable.u64_add(a, c)));
  return ok(r);
};

// MUL_IMM_32
export const mul_imm_32: InstructionRun = (r, args, registers) => {
  registers[reg(args.b)] = u32SignExtend(u32(portable.u64_mul(registers[reg(args.a)], u64(args.c))));
  return ok(r);
};

// NEG_ADD_IMM_32
export const neg_add_imm_32: InstructionRun = (r, args, registers) => {
  const sum = portable.u64_sub(u64(args.c) | u64(0x1_0000_0000), registers[reg(args.a)]);
  registers[reg(args.b)] = u32SignExtend(u32(sum));
  return ok(r);
};

// ADD_IMM
export const add_imm: InstructionRun = (r, args, registers) => {
  const sum: u64 = portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c));
  registers[reg(args.b)] = sum;
  return ok(r);
};

// MUL_IMM
export const mul_imm: InstructionRun = (r, args, registers) => {
  registers[reg(args.b)] = portable.u64_mul(registers[reg(args.a)], u32SignExtend(args.c));
  return ok(r);
};

// NEG_ADD_IMM
export const neg_add_imm: InstructionRun = (r, args, registers) => {
  const sum = portable.u64_sub(u32SignExtend(args.c), registers[reg(args.a)]);
  registers[reg(args.b)] = sum;
  return ok(r);
};

// ADD_32
export const add_32: InstructionRun = (r, args, registers) => {
  const a = u32(registers[reg(args.a)]);
  const b = u32(registers[reg(args.b)]);
  registers[reg(args.c)] = u32SignExtend(a + b);
  return ok(r);
};

// SUB_32
export const sub_32: InstructionRun = (r, args, registers) => {
  const a = registers[reg(args.b)];
  const b = u64(0x1_0000_0000 - u32(registers[reg(args.a)]));
  registers[reg(args.c)] = u32SignExtend(u32(portable.u64_add(a, b)));
  return ok(r);
};

// MUL_32
export const mul_32: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = u32SignExtend(u32(portable.u64_mul(registers[reg(args.a)], registers[reg(args.b)])));
  return ok(r);
};

// DIV_U_32
export const div_u_32: InstructionRun = (r, args, registers) => {
  const a = u32(registers[reg(args.a)]);
  if (a === 0) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else {
    const b = u32(registers[reg(args.b)]);
    registers[reg(args.c)] = u32SignExtend(b / a);
  }
  return ok(r);
};

// DIV_S_32
export const div_s_32: InstructionRun = (r, args, registers) => {
  const b = i64(u32SignExtend(u32(registers[reg(args.b)])));
  const a = i64(u32SignExtend(u32(registers[reg(args.a)])));
  if (a === i64(0)) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else if (a === i64(-1) && b === i64(i32.MIN_VALUE)) {
    registers[reg(args.c)] = u64(b);
  } else {
    registers[reg(args.c)] = u64(b / a);
  }
  return ok(r);
};

// REM_U_32
export const rem_u_32: InstructionRun = (r, args, registers) => {
  const a = u32(registers[reg(args.a)]);
  const b = u32(registers[reg(args.b)]);
  if (a === 0) {
    registers[reg(args.c)] = u32SignExtend(b);
  } else {
    registers[reg(args.c)] = u32SignExtend(b % a);
  }
  return ok(r);
};

// REM_S_32
export const rem_s_32: InstructionRun = (r, args, registers) => {
  const b = i32(registers[reg(args.b)]);
  const a = i32(registers[reg(args.a)]);
  if (a === 0) {
    registers[reg(args.c)] = u64(i64(b));
  } else if (a === -1 && b === i32.MIN_VALUE) {
    registers[reg(args.c)] = u64(0);
  } else {
    registers[reg(args.c)] = u64(i64(b) % i64(a));
  }
  return ok(r);
};

// ADD_64
export const add_64: InstructionRun = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = portable.u64_add(a, b);
  return ok(r);
};

// SUB
export const sub: InstructionRun = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = portable.u64_sub(b, a);
  return ok(r);
};

// MUL
export const mul: InstructionRun = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = portable.u64_mul(a, b);
  return ok(r);
};

// DIV_U
export const div_u: InstructionRun = (r, args, registers) => {
  if (registers[reg(args.a)] === u64(0)) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else {
    registers[reg(args.c)] = registers[reg(args.b)] / registers[reg(args.a)];
  }
  return ok(r);
};

// DIV_S
export const div_s: InstructionRun = (r, args, registers) => {
  const b = i64(registers[reg(args.b)]);
  const a = i64(registers[reg(args.a)]);
  if (a === i64(0)) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else if (a === i64(-1) && b === i64.MIN_VALUE) {
    registers[reg(args.c)] = u64(b);
  } else {
    registers[reg(args.c)] = u64(b / a);
  }
  return ok(r);
};

// REM_U
export const rem_u: InstructionRun = (r, args, registers) => {
  if (registers[reg(args.a)] === u64(0)) {
    registers[reg(args.c)] = registers[reg(args.b)];
  } else {
    registers[reg(args.c)] = registers[reg(args.b)] % registers[reg(args.a)];
  }
  return ok(r);
};

// REM_S
export const rem_s: InstructionRun = (r, args, registers) => {
  const b = i64(registers[reg(args.b)]);
  const a = i64(registers[reg(args.a)]);
  if (a === i64(0)) {
    registers[reg(args.c)] = u64(b);
  } else if (a === i64(-1) && b === i64.MIN_VALUE) {
    registers[reg(args.c)] = u64(0);
  } else {
    registers[reg(args.c)] = u64(b % a);
  }
  return ok(r);
};

// MUL_UPPER_S_S
export const mul_upper_s_s: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = mulUpperSigned(i64(registers[reg(args.b)]), i64(registers[reg(args.a)]));
  return ok(r);
};

// MUL_UPPER_U_U
export const mul_upper_u_u: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = mulUpperUnsigned(registers[reg(args.b)], registers[reg(args.a)]);
  return ok(r);
};

// MUL_UPPER_S_U
export const mul_upper_s_u: InstructionRun = (r, args, registers) => {
  registers[reg(args.c)] = mulUpperSignedUnsigned(i64(registers[reg(args.b)]), registers[reg(args.a)]);
  return ok(r);
};

// MAX
export const max: InstructionRun = (r, args, registers) => {
  const a = i64(registers[reg(args.a)]);
  const b = i64(registers[reg(args.b)]);
  registers[reg(args.c)] = u64(a < b ? b : a);
  return ok(r);
};

// MAX_U
export const max_u: InstructionRun = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = a < b ? b : a;
  return ok(r);
};

// MIN
export const min: InstructionRun = (r, args, registers) => {
  const a = i64(registers[reg(args.a)]);
  const b = i64(registers[reg(args.b)]);
  registers[reg(args.c)] = u64(a > b ? b : a);
  return ok(r);
};

// MIN_U
export const min_u: InstructionRun = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = a > b ? b : a;
  return ok(r);
};
