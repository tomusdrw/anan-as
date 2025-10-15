import { Args } from "../arguments";
import { MemoryBuilder } from "../memory";
import { newRegisters } from "../registers";
import { Assert, Test, test } from "../test";
import { Outcome, OutcomeData } from "./outcome";
import { rot_l_32, rot_l_64, rot_r_64_imm, rot_r_64_imm_alt } from "./rot";
import { reg } from "./utils";

export const TESTS: Test[] = [
  test("rot_r_64_imm", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x0;
    args.b = 0x1;
    args.c = 0x8;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xdead_beef;

    const memo = new MemoryBuilder().build();

    // when
    const ret = rot_r_64_imm(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.b)], 0xef00_0000_00de_adbe);
    return assert;
  }),
  test("rot_r_64_imm_alt", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x0;
    args.b = 0x1;
    args.c = 0xdead_beef;
    const regs = newRegisters();
    regs[reg(args.a)] = 0x8;

    const memo = new MemoryBuilder().build();

    // when
    const ret = rot_r_64_imm_alt(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.b)], 0xefff_ffff_ffde_adbe);
    return assert;
  }),
  test("rot_l_64", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x0;
    args.b = 0x1;
    args.c = 0x8;
    const regs = newRegisters();
    regs[reg(args.a)] = 0x8;
    regs[reg(args.b)] = 0xdead_beef;

    const memo = new MemoryBuilder().build();

    // when
    const ret = rot_l_64(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], 0x0000_00de_adbe_ef00);
    return assert;
  }),
  test("rot_l_32", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x0;
    args.b = 0x1;
    args.c = 0x8;
    const regs = newRegisters();
    regs[reg(args.a)] = 0x8;
    regs[reg(args.b)] = 0xdead_beef;

    const memo = new MemoryBuilder().build();

    // when
    const ret = rot_l_32(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(ret.outcome, Outcome.Ok, "outcome");
    assert.isEqual<u64>(regs[reg(args.c)], 0xffff_ffff_adbe_efde);
    return assert;
  }),
];
