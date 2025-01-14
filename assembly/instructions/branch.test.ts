import { Args } from "../arguments";
import { MemoryBuilder } from "../memory";
import { newRegisters } from "../registers";
import { Assert, Test, test } from "../test";
import { branch_eq_imm } from "./branch";
import { Outcome } from "./outcome";
import { reg } from "./utils";

export const TESTS: Test[] = [
  test("branch_eq_imm", () => {
    // when
    const args = new Args();
    args.a = 0;
    args.b = 0xfe;
    args.c = 0xdeadbeef;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xfe;

    const memo = new MemoryBuilder().build(0);

    // when
    const ret = branch_eq_imm(args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.StaticJump, "outcome");
    assert.isEqual(ret.staticJump, 0xdeadbeef, "staticJump");
    return assert;
  }),
];
