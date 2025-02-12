import { INSTRUCTIONS, MISSING_INSTRUCTION } from "../instructions";
import { Program, decodeArguments } from "../program";
import { Registers } from "../registers";
import { CompileContext } from "./context";
import { COMPILE } from "./instructions";

export function compile(program: Program, initialPc: u32, gas: i64, registers: Registers): string {
  const ctx = new CompileContext();
  // externalities
  ctx.push("declare function trap(): void;");
  ctx.push("declare function outOfGas(): void;");
  ctx.push("declare function fault(address: u32): void;");
  ctx.push("declare function dumpReg(idx: u32, data: i64): void;");

  for (let i = 0; i < registers.length; i++) {
    ctx.push(`let regs${i}: i64 = 0x${registers[i].toString(16)};`);
  }
  ctx.push(`\nlet gas = 0x${gas.toString(16)};\n`);

  // initial entry point
  ctx.push(`\nblock${initialPc}();\n`);

  // program
  ctx.pc = 0;
  let blockGas: i64 = 0;
  while (ctx.pc < <u32>program.code.length) {
    if (!program.mask.isInstruction(ctx.pc)) {
      throw new Error("not an instruction?");
    }

    if (program.basicBlocks.isStart(ctx.pc)) {
      if (ctx.pc > 0) {
        ctx.endBlock(blockGas);
      }
      ctx.startBlock(ctx.pc);
      blockGas = 0;
    }

    const instruction = program.code[ctx.pc];
    const iData = <i32>instruction < INSTRUCTIONS.length ? INSTRUCTIONS[instruction] : MISSING_INSTRUCTION;

    blockGas += iData.gas;
    const skipBytes = program.mask.bytesToNextInstruction(ctx.pc);
    const args = decodeArguments(iData.kind, program.code.subarray(ctx.pc + 1), skipBytes);
    // TODO gas stuff?
    const exe = COMPILE[instruction];
    ctx.addBlockLine(`{ // ${changetype<string>(iData.namePtr)}`);
    // handle jumps and other results?
    exe(ctx, args);
    ctx.addBlockLine("};");
    // move to next instruction
    ctx.pc += 1 + skipBytes;
  }

  ctx.endBlock(blockGas);

  // utility functions
  ctx.push("// utils");
  ctx.push("@inline function u32SignExtend(v: u32): i64 { return i64(i32(v)); }");
  ctx.push("@inline function u16SignExtend(v: u16): i64 { return i64(i32(i16(v))); }");
  ctx.push("@inline function u8SignExtend(v: u8): i64 { return i64(i32(i16(i8(v)))); }");

  // print out registers at the end
  ctx.push("\n// registers");
  for (let i = 0; i < registers.length; i++) {
    ctx.push(`dumpReg(${i}, regs${i});`);
  }

  // TODO [ToDr] print out what we have here?
  return ctx.data.join("\n");
}
