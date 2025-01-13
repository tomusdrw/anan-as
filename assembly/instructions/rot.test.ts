import { Args } from "../arguments";
import { MemoryBuilder } from "../memory";
import { newRegisters } from "../registers";
import { Assert, Test, test } from "../test";
import { Outcome } from "./outcome";
import { rot_l_32 } from "./rot";
import { reg } from "./utils";

export const TESTS: Test[] = [
  test("rot_l_32", () => {
    // when
    const args = new Args();
    args.a = 0x0;
    args.b = 0x1;
    args.c = 0x3;
    const regs = newRegisters();
    regs[reg(args.a)] = 2 ** 64 - 1;
    regs[reg(args.b)] = 2 ** 64 - 1;

    const memo = new MemoryBuilder().build(0);

    // when
    const ret = rot_l_32(args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(args.c)], 0xffff_ffff_ffff_fffe);
    return assert;
  }),
];
