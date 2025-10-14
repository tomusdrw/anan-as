import { Args } from "../arguments";
import { MemoryBuilder } from "../memory";
import { newRegisters } from "../registers";
import { Assert, Test, test } from "../test";
import { and_inv, or_inv, xnor } from "./logic";
import { Outcome, OutcomeData } from "./outcome";
import { reg } from "./utils";

export const TESTS: Test[] = [
  test("and_inv", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x0;
    args.b = 0x1;
    args.c = 0x3;
    const regs = newRegisters();
    regs[reg(args.a)] = 0x0000_0000_000f;
    regs[reg(args.b)] = 0xf000_0000_0001;

    const memo = new MemoryBuilder().build();

    // when
    const ret = and_inv(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], 0x0000_f000_0000_0000);
    return assert;
  }),
  test("or_inv", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x0;
    args.b = 0x1;
    args.c = 0x3;
    const regs = newRegisters();
    regs[reg(args.a)] = 0x0000_0000_000f;
    regs[reg(args.b)] = 0xf000_0000_0001;

    const memo = new MemoryBuilder().build();

    // when
    const ret = or_inv(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], 0xffff_ffff_ffff_fff1);
    return assert;
  }),
  test("xnor", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x0;
    args.b = 0x1;
    args.c = 0x3;
    const regs = newRegisters();
    regs[reg(args.a)] = 0x0000_0000_000f;
    regs[reg(args.b)] = 0xf000_0000_0000;

    const memo = new MemoryBuilder().build();

    // when
    const ret = xnor(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], 0xffff_0fff_ffff_fff0);
    return assert;
  }),
];
