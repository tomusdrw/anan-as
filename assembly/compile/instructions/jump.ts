// This file is auto-generated, take a look at compile-gen.js

import { InstructionRun, dJump, staticJump } from "./outcome";
import { reg, u32SignExtend } from "./utils";

// JUMP
export const jump: InstructionRun = (ctx, args) => {
ctx.staticJump(args.a)

};

// JUMP_IND
export const jump_ind: InstructionRun = (ctx, args) => {
  ctx.addBlockLine(`  const address = u32(regs[${reg(args.a)}] + ${u32SignExtend(args.b)});`, args);
ctx.dJump("address");

};

// LOAD_IMM_JUMP
export const load_imm_jump: InstructionRun = (ctx, args) => {
  ctx.addBlockLine(`  regs[${reg(args.a)}] = ${u32SignExtend(args.b)};`, args);
ctx.staticJump(args.c);

};

// LOAD_IMM_JUMP_IND
export const load_imm_jump_ind: InstructionRun = (ctx, args) => {
  ctx.addBlockLine(`  const address = u32(regs[${reg(args.a)}] + ${u32SignExtend(args.d)});`, args);
  ctx.addBlockLine(`  regs[${reg(args.b)}] = ${u32SignExtend(args.c)};`, args);
ctx.dJump("address");

};
