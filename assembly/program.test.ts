import {Arguments} from "./arguments";
import {RUN} from "./instructions-exe";
import {jump_ind} from "./instructions/jump";
import {trap} from "./instructions/misc";
import {InstructionRun} from "./instructions/outcome";
import {BasicBlocks, decodeArguments, Mask} from "./program";
import {Assert, test, Test} from "./test";

export function u8arr(data: number[]): Uint8Array {
  const ret = new Uint8Array(data.length);
  ret.set(data, 0);
  return ret;
}

export const TESTS: Test[] = [
  test("should parse packed mask correctly", () => {
    const mask = new Mask(u8arr([0b0001_0000, 0b1000_0000, 0b1111_1000]), 21);

    const assert = new Assert;
    assert.isArrayEqual<u32>(mask.bytesToSkip.slice(), [4,3,2,1,0,10,9,8,7,6,5,4,3,2,1,0,3,2,1,0,0]);

    assert.isEqual(mask.isInstruction(0), false);
    assert.isEqual(mask.isInstruction(4), true);

    assert.isEqual(mask.skipBytesToNextInstruction(20), 0);
    assert.isEqual(mask.skipBytesToNextInstruction(22), 0);
    return assert;
  }),

  test('should not allow skipping more than 24 bytes', () => {
    const mask = new Mask(u8arr([
      0b0000_0001,
      0b0000_0000,
      0b0000_0000,
      0b1000_0000
    ]), 32);

    const assert = new Assert;
    assert.isArrayEqual<u32>(mask.bytesToSkip.slice(), [
      0,24,24,24,24,24,24,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0
    ]);
    return assert;
  }),

  test('should decode arguments correctly', () => {
    const data = u8arr([0xff, 0xff, 0xff, 0xff]);
    const args = decodeArguments(Arguments.OneImm, data, 4);

    const assert = new Assert;
    assert.isEqual(args.a, -1, 'a');
    assert.isEqual(args.b, 0, 'b');
    assert.isEqual(args.c, 0, 'c');
    assert.isEqual(args.d, 0, 'd');
    return assert;
  }),

  test('should decode positive bounded by skip', () => {
    const data = u8arr([0x05, 0x05]);
    const args = decodeArguments(Arguments.OneImm, data, 1);

    const assert = new Assert;
    assert.isEqual(args.a, 5, 'a');
    assert.isEqual(args.b, 0, 'b');
    assert.isEqual(args.c, 0, 'c');
    assert.isEqual(args.d, 0, 'd');
    return assert;
  }),

  test('should construct basic blocks', () => {
    const code = u8arr([
      opcode(trap),
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    const mask = new Mask(u8arr([
      0b0000_0001,
      0b0000_0000,
      0b0000_0000,
      0b1000_0000
    ]), 32);
    const basicBlocks = new BasicBlocks(code, mask);
    const assert = new Assert;
    assert.isEqual(
      basicBlocks.toString(),
      "BasicBlocks[0 -> startend, 1 -> start, 31 -> end, ]"
    );
    return assert;
  }),

  test('should construct basic blocks correctly based on skip', () => {
    const code = u8arr([
      opcode(trap),
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, opcode(jump_ind),
    ]);
    const mask = new Mask(u8arr([
      0b0000_0001,
      0b0000_0000,
      0b0000_0000,
      0b1000_0000
    ]), 32);
    const basicBlocks = new BasicBlocks(code, mask);
    const assert = new Assert;
    assert.isEqual(
      mask.toString(),
      "Mask[0, 24, 24, 24, 24, 24, 24, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, ]",
    );
    assert.isEqual(
      basicBlocks.toString(),
      "BasicBlocks[0 -> startend, 1 -> start, 31 -> end, ]"
    );
    return assert;
  }),
];

function opcode(search: InstructionRun): number {
  return RUN.indexOf(search);
}

