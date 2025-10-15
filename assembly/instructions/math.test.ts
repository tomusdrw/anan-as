import { Args } from "../arguments";
import { MemoryBuilder } from "../memory";
import { newRegisters } from "../registers";
import { Assert, Test, test } from "../test";
import * as math from "./math";
import { Outcome, OutcomeData } from "./outcome";
import { reg } from "./utils";

export const TESTS: Test[] = [
  test("max", () => {
    // when
    const r = new OutcomeData();
    const args = new Args().fill(0x0, 0x1, 0x3);
    const regs = newRegisters();
    regs[reg(args.a)] = -(2 ** 63);
    regs[reg(args.b)] = 2;

    const memo = new MemoryBuilder().build();

    // when
    const ret = math.max(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], 2);
    return assert;
  }),
  test("max_u", () => {
    // when
    const r = new OutcomeData();
    const args = new Args().fill(0x0, 0x1, 0x3);
    const regs = newRegisters();
    regs[reg(args.a)] = -(2 ** 63);
    regs[reg(args.b)] = 2;

    const memo = new MemoryBuilder().build();

    // when
    const ret = math.max_u(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], -(2 ** 63));
    return assert;
  }),
  test("min", () => {
    // when
    const r = new OutcomeData();
    const args = new Args().fill(0x0, 0x1, 0x3);
    const regs = newRegisters();
    regs[reg(args.a)] = -(2 ** 63);
    regs[reg(args.b)] = 2;

    const memo = new MemoryBuilder().build();

    // when
    const ret = math.min(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], -(2 ** 63));
    return assert;
  }),
  test("min_u", () => {
    // when
    const r = new OutcomeData();
    const args = new Args().fill(0x0, 0x1, 0x3);
    const regs = newRegisters();
    regs[reg(args.a)] = -(2 ** 63);
    regs[reg(args.b)] = 2;

    const memo = new MemoryBuilder().build();

    // when
    const ret = math.min_u(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], 2);
    return assert;
  }),
  test("add_32", () => {
    // when
    const r = new OutcomeData();
    const args = new Args().fill(0x0, 0x1, 0x3);
    const regs = newRegisters();
    regs[reg(args.a)] = 2 ** 64 - 1;
    regs[reg(args.b)] = 2 ** 64 - 1;

    const memo = new MemoryBuilder().build();

    // when
    const ret = math.add_32(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], 0xffff_ffff_ffff_fffe);
    return assert;
  }),
];
