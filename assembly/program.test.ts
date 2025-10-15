import { Args, Arguments } from "./arguments";
import { jump_ind } from "./instructions/jump";
import { trap } from "./instructions/misc";
import { InstructionRun } from "./instructions/outcome";
import { RUN } from "./instructions-exe";
import { BasicBlocks, deblob, decodeArguments, JumpTable, Mask } from "./program";
import { Assert, Test, test } from "./test";

export function u8arr(data: number[]): Uint8Array {
  const ret = new Uint8Array(data.length);
  ret.set(data, 0);
  return ret;
}

export const TESTS: Test[] = [
  test("should parse packed mask correctly", () => {
    const mask = new Mask(u8arr([0b0001_0000, 0b1000_0000, 0b1111_1000]), 21);

    const assert = new Assert();
    assert.isArrayEqual<u32>(
      mask.bytesToSkip.slice(),
      [4, 3, 2, 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 3, 2, 1, 0, 0],
    );

    assert.isEqual(mask.isInstruction(0), false);
    assert.isEqual(mask.isInstruction(4), true);

    assert.isEqual(mask.skipBytesToNextInstruction(20), 0);
    assert.isEqual(mask.skipBytesToNextInstruction(22), 0);
    return assert;
  }),

  test("should not allow skipping more than 24 bytes", () => {
    const mask = new Mask(u8arr([0b0000_0001, 0b0000_0000, 0b0000_0000, 0b1000_0000]), 32);

    const assert = new Assert();
    assert.isArrayEqual<u32>(
      mask.bytesToSkip.slice(),
      [
        0, 25, 25, 25, 25, 25, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2,
        1, 0,
      ],
    );
    return assert;
  }),

  test("should decode arguments correctly", () => {
    const r = new Args();
    const data = u8arr([0xff, 0xff, 0xff, 0xff]);
    const args = decodeArguments(r, Arguments.OneImm, data, 0, 4);

    const assert = new Assert();
    assert.isEqual(args.a, -1, "a");
    assert.isEqual(args.b, 0, "b");
    assert.isEqual(args.c, 0, "c");
    assert.isEqual(args.d, 0, "d");
    return assert;
  }),

  test("should decode positive bounded by skip", () => {
    const r = new Args();
    const data = u8arr([0x05, 0x05]);
    const args = decodeArguments(r, Arguments.OneImm, data, 0, 1);

    const assert = new Assert();
    assert.isEqual(args.a, 5, "a");
    assert.isEqual(args.b, 0, "b");
    assert.isEqual(args.c, 0, "c");
    assert.isEqual(args.d, 0, "d");
    return assert;
  }),

  test("should deblob program", () => {
    const raw = u8arr([
      0, 0, 33, 51, 8, 1, 51, 9, 1, 40, 3, 0, 149, 119, 255, 81, 7, 12, 100, 138, 200, 152, 8, 100, 169, 40, 243, 100,
      135, 51, 8, 51, 9, 1, 50, 0, 73, 147, 82, 213, 0,
    ]);
    const program = deblob(raw);
    const assert = new Assert();
    assert.isEqual(
      program.mask.toString(),
      "Mask[0, 2, 1, 0, 2, 1, 0, 1, 0, 0, 2, 1, 0, 2, 1, 0, 1, 0, 2, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1, ]",
    );
    assert.isEqual(program.jumpTable.toString(), "JumpTable[]");
    assert.isEqual(
      program.basicBlocks.toString(),
      "BasicBlocks[0 -> start, 6 -> end, 8 -> startend, 9 -> start, 12 -> end, 15 -> start, 22 -> end, 24 -> start, 30 -> end, 31 -> startend, ]",
    );
    return assert;
  }),

  test("should construct basic blocks correctly based on skip", () => {
    const code = u8arr([
      opcode(trap),
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      opcode(jump_ind),
    ]);
    const mask = new Mask(u8arr([0b0000_0001, 0b0000_0000, 0b0000_0000, 0b1000_0000]), 32);
    const basicBlocks = new BasicBlocks(code, mask);
    const assert = new Assert();
    assert.isEqual(
      mask.toString(),
      "Mask[0, 25, 25, 25, 25, 25, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, ]",
    );
    assert.isEqual(basicBlocks.toString(), "BasicBlocks[0 -> startend, 26 -> start, 31 -> end, ]");
    return assert;
  }),
  test("should parse jump table with large numbers", () => {
    const jumpTable = new JumpTable(
      10,
      u8arr([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2, 0, 2, 2, 2, 0]),
    );
    const assert = new Assert();
    assert.isEqual(
      jumpTable.toString(),
      "JumpTable[0 -> 18446744073709551615, 1 -> 18446744073709551615, 2 -> 18446744073709551615, ]",
    );
    return assert;
  }),
];

function opcode(search: InstructionRun): number {
  const idx = RUN.indexOf(search);
  if (idx < 0) {
    throw new Error("Opcode not found in RUN table for instruction");
  }
  return idx;
}
