import { portable } from "../portable";
import { InstructionRun, OutcomeData } from "./outcome";
import { Inst, mulUpperSigned, mulUpperSignedUnsigned, mulUpperUnsigned } from "./utils";

// ADD_IMM_32
export const add_imm_32: InstructionRun = (r, args, registers) => {
  const a = registers[Inst.reg(args.a)];
  const c = Inst.u32SignExtend(args.c);
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(u32(portable.u64_add(a, c)));
  return OutcomeData.ok(r);
};

// MUL_IMM_32
export const mul_imm_32: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(u32(portable.u64_mul(registers[Inst.reg(args.a)], u64(args.c))));
  return OutcomeData.ok(r);
};

// NEG_ADD_IMM_32
export const neg_add_imm_32: InstructionRun = (r, args, registers) => {
  const sum = portable.u64_sub(u64(args.c) | u64(0x1_0000_0000), registers[Inst.reg(args.a)]);
  registers[Inst.reg(args.b)] = Inst.u32SignExtend(u32(sum));
  return OutcomeData.ok(r);
};

// ADD_IMM
export const add_imm: InstructionRun = (r, args, registers) => {
  const sum: u64 = portable.u64_add(registers[Inst.reg(args.a)], Inst.u32SignExtend(args.c));
  registers[Inst.reg(args.b)] = sum;
  return OutcomeData.ok(r);
};

// MUL_IMM
export const mul_imm: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.b)] = portable.u64_mul(registers[Inst.reg(args.a)], Inst.u32SignExtend(args.c));
  return OutcomeData.ok(r);
};

// NEG_ADD_IMM
export const neg_add_imm: InstructionRun = (r, args, registers) => {
  const sum = portable.u64_sub(Inst.u32SignExtend(args.c), registers[Inst.reg(args.a)]);
  registers[Inst.reg(args.b)] = sum;
  return OutcomeData.ok(r);
};

// ADD_32
export const add_32: InstructionRun = (r, args, registers) => {
  const a = u32(registers[Inst.reg(args.a)]);
  const b = u32(registers[Inst.reg(args.b)]);
  registers[Inst.reg(args.c)] = Inst.u32SignExtend(a + b);
  return OutcomeData.ok(r);
};

// SUB_32
export const sub_32: InstructionRun = (r, args, registers) => {
  const a = registers[Inst.reg(args.b)];
  const b = u64(0x1_0000_0000 - u32(registers[Inst.reg(args.a)]));
  registers[Inst.reg(args.c)] = Inst.u32SignExtend(u32(portable.u64_add(a, b)));
  return OutcomeData.ok(r);
};

// MUL_32
export const mul_32: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = Inst.u32SignExtend(
    u32(portable.u64_mul(registers[Inst.reg(args.a)], registers[Inst.reg(args.b)])),
  );
  return OutcomeData.ok(r);
};

// DIV_U_32
export const div_u_32: InstructionRun = (r, args, registers) => {
  const a = u32(registers[Inst.reg(args.a)]);
  if (a === 0) {
    registers[Inst.reg(args.c)] = u64.MAX_VALUE;
  } else {
    const b = u32(registers[Inst.reg(args.b)]);
    registers[Inst.reg(args.c)] = Inst.u32SignExtend(b / a);
  }
  return OutcomeData.ok(r);
};

// DIV_S_32
export const div_s_32: InstructionRun = (r, args, registers) => {
  const b = i64(Inst.u32SignExtend(u32(registers[Inst.reg(args.b)])));
  const a = i64(Inst.u32SignExtend(u32(registers[Inst.reg(args.a)])));
  if (a === i64(0)) {
    registers[Inst.reg(args.c)] = u64.MAX_VALUE;
  } else if (a === i64(-1) && b === i64(i32.MIN_VALUE)) {
    registers[Inst.reg(args.c)] = u64(b);
  } else {
    registers[Inst.reg(args.c)] = u64(b / a);
  }
  return OutcomeData.ok(r);
};

// REM_U_32
export const rem_u_32: InstructionRun = (r, args, registers) => {
  const a = u32(registers[Inst.reg(args.a)]);
  const b = u32(registers[Inst.reg(args.b)]);
  if (a === 0) {
    registers[Inst.reg(args.c)] = Inst.u32SignExtend(b);
  } else {
    registers[Inst.reg(args.c)] = Inst.u32SignExtend(b % a);
  }
  return OutcomeData.ok(r);
};

// REM_S_32
export const rem_s_32: InstructionRun = (r, args, registers) => {
  const b = i32(registers[Inst.reg(args.b)]);
  const a = i32(registers[Inst.reg(args.a)]);
  if (a === 0) {
    registers[Inst.reg(args.c)] = u64(i64(b));
  } else if (a === -1 && b === i32.MIN_VALUE) {
    registers[Inst.reg(args.c)] = u64(0);
  } else {
    registers[Inst.reg(args.c)] = u64(i64(b) % i64(a));
  }
  return OutcomeData.ok(r);
};

// ADD_64
export const add_64: InstructionRun = (r, args, registers) => {
  const a = registers[Inst.reg(args.a)];
  const b = registers[Inst.reg(args.b)];
  registers[Inst.reg(args.c)] = portable.u64_add(a, b);
  return OutcomeData.ok(r);
};

// SUB
export const sub: InstructionRun = (r, args, registers) => {
  const a = registers[Inst.reg(args.a)];
  const b = registers[Inst.reg(args.b)];
  registers[Inst.reg(args.c)] = portable.u64_sub(b, a);
  return OutcomeData.ok(r);
};

// MUL
export const mul: InstructionRun = (r, args, registers) => {
  const a = registers[Inst.reg(args.a)];
  const b = registers[Inst.reg(args.b)];
  registers[Inst.reg(args.c)] = portable.u64_mul(a, b);
  return OutcomeData.ok(r);
};

// DIV_U
export const div_u: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.a)] === u64(0)) {
    registers[Inst.reg(args.c)] = u64.MAX_VALUE;
  } else {
    registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)] / registers[Inst.reg(args.a)];
  }
  return OutcomeData.ok(r);
};

// DIV_S
export const div_s: InstructionRun = (r, args, registers) => {
  const b = i64(registers[Inst.reg(args.b)]);
  const a = i64(registers[Inst.reg(args.a)]);
  if (a === i64(0)) {
    registers[Inst.reg(args.c)] = u64.MAX_VALUE;
  } else if (a === i64(-1) && b === i64.MIN_VALUE) {
    registers[Inst.reg(args.c)] = u64(b);
  } else {
    registers[Inst.reg(args.c)] = u64(b / a);
  }
  return OutcomeData.ok(r);
};

// REM_U
export const rem_u: InstructionRun = (r, args, registers) => {
  if (registers[Inst.reg(args.a)] === u64(0)) {
    registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)];
  } else {
    registers[Inst.reg(args.c)] = registers[Inst.reg(args.b)] % registers[Inst.reg(args.a)];
  }
  return OutcomeData.ok(r);
};

// REM_S
export const rem_s: InstructionRun = (r, args, registers) => {
  const b = i64(registers[Inst.reg(args.b)]);
  const a = i64(registers[Inst.reg(args.a)]);
  if (a === i64(0)) {
    registers[Inst.reg(args.c)] = u64(b);
  } else if (a === i64(-1) && b === i64.MIN_VALUE) {
    registers[Inst.reg(args.c)] = u64(0);
  } else {
    registers[Inst.reg(args.c)] = u64(b % a);
  }
  return OutcomeData.ok(r);
};

// MUL_UPPER_S_S
export const mul_upper_s_s: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = mulUpperSigned(i64(registers[Inst.reg(args.b)]), i64(registers[Inst.reg(args.a)]));
  return OutcomeData.ok(r);
};

// MUL_UPPER_U_U
export const mul_upper_u_u: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = mulUpperUnsigned(registers[Inst.reg(args.b)], registers[Inst.reg(args.a)]);
  return OutcomeData.ok(r);
};

// MUL_UPPER_S_U
export const mul_upper_s_u: InstructionRun = (r, args, registers) => {
  registers[Inst.reg(args.c)] = mulUpperSignedUnsigned(i64(registers[Inst.reg(args.b)]), registers[Inst.reg(args.a)]);
  return OutcomeData.ok(r);
};

// MAX
export const max: InstructionRun = (r, args, registers) => {
  const a = i64(registers[Inst.reg(args.a)]);
  const b = i64(registers[Inst.reg(args.b)]);
  registers[Inst.reg(args.c)] = u64(a < b ? b : a);
  return OutcomeData.ok(r);
};

// MAX_U
export const max_u: InstructionRun = (r, args, registers) => {
  const a = registers[Inst.reg(args.a)];
  const b = registers[Inst.reg(args.b)];
  registers[Inst.reg(args.c)] = a < b ? b : a;
  return OutcomeData.ok(r);
};

// MIN
export const min: InstructionRun = (r, args, registers) => {
  const a = i64(registers[Inst.reg(args.a)]);
  const b = i64(registers[Inst.reg(args.b)]);
  registers[Inst.reg(args.c)] = u64(a > b ? b : a);
  return OutcomeData.ok(r);
};

// MIN_U
export const min_u: InstructionRun = (r, args, registers) => {
  const a = registers[Inst.reg(args.a)];
  const b = registers[Inst.reg(args.b)];
  registers[Inst.reg(args.c)] = a > b ? b : a;
  return OutcomeData.ok(r);
};
