import { Args } from "../arguments";
import { MemoryBuilder } from "../memory";
import { newRegisters } from "../registers";
import { Assert, Test, test } from "../test";
import {
  count_set_bits_32,
  count_set_bits_64,
  leading_zero_bits_32,
  leading_zero_bits_64,
  reverse_bytes,
  sign_extend_8,
  sign_extend_16,
  trailing_zero_bits_32,
  trailing_zero_bits_64,
  zero_extend_16,
} from "./bit";
import { Outcome, OutcomeData } from "./outcome";
import { reg } from "./utils";

export const TESTS: Test[] = [
  test("count_set_bits_64", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xffff_0000_1111;
    const memo = new MemoryBuilder().build();

    // when
    const res = count_set_bits_64(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 2 * 8 + 4);
    return assert;
  }),
  test("count_set_bits_32", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xffff_0000_1111;
    const memo = new MemoryBuilder().build();

    // when
    const res = count_set_bits_32(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 4);
    return assert;
  }),
  test("leading_zero_bits_64", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xfff0_0000_0111;
    const memo = new MemoryBuilder().build();

    // when
    const res = leading_zero_bits_64(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 16);
    return assert;
  }),
  test("leading_zero_bits_32", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xffff_0000_1111;
    const memo = new MemoryBuilder().build();

    // when
    const res = leading_zero_bits_32(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 19);
    return assert;
  }),
  test("trailing_zero_bits_64", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xfff0_0000_0000;
    const memo = new MemoryBuilder().build();

    // when
    const res = trailing_zero_bits_64(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 36);
    return assert;
  }),
  test("trailing_zero_bits_32", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xfff0_0000_0000;
    const memo = new MemoryBuilder().build();

    // when
    const res = trailing_zero_bits_32(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 32);
    return assert;
  }),
  test("sign_extend_8", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xdead_beef;
    const memo = new MemoryBuilder().build();

    // when
    const res = sign_extend_8(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 0xffff_ffff_ffff_ffef);
    return assert;
  }),
  test("sign_extend_16", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xdead_beef;
    const memo = new MemoryBuilder().build();

    // when
    const res = sign_extend_16(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 0xffff_ffff_ffff_beef);
    return assert;
  }),
  test("zero_extend_16", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xdead_beef;
    const memo = new MemoryBuilder().build();

    // when
    const res = zero_extend_16(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 0x0000_beef);
    return assert;
  }),
  test("reverse_bytes", () => {
    // when
    const r = new OutcomeData();
    const args = new Args();
    args.a = 0x1;
    args.b = 0xf;
    const regs = newRegisters();
    regs[reg(args.a)] = 0xfff0_dead_beef;
    const memo = new MemoryBuilder().build();

    // when
    const res = reverse_bytes(r, args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(res.outcome, Outcome.Ok, "outcome");
    assert.isEqual(regs[reg(0xf)], 0xefbe_adde_f0ff_0000);
    return assert;
  }),
];
