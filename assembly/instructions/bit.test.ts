import { Args } from "../arguments";
import { MemoryBuilder } from "../memory";
import { newRegisters } from "../registers";
import { Assert, Test, test } from "../test";
import { count_set_bits_64 } from "./bit";

export const TESTS: Test[] = [
  test("count_set_bits_64", () => {
    // when
    const args = new Args();
    const regs = newRegisters();
    const memo = new MemoryBuilder().build(0);

    // when
    count_set_bits_64(args, regs, memo);

    // then
    const assert = new Assert();
    assert.isEqual(regs[0], 15);
    return assert;
  }),
];
