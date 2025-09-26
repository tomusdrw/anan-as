import { liftBytes } from "./program";
import { decodeSpi } from "./spi";
import { Assert, Test, test } from "./test";

export const TESTS: Test[] = [
  test("should decode standard program", () => {
    const PROGRAM = liftBytes([
      0x04, 0x00, 0x00, 0x02, 0x00, 0x00, 0x03, 0x00, 0x20, 0x00, 0x00, 0xab, 0xcd, 0xef, 0x01, 0x12, 0x34, 0x07, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x03, 0xc8, 0x87, 0x09, 0x01,
    ]);
    const ARGS = liftBytes([0x12, 0x34, 0x56]);

    const spi = decodeSpi(PROGRAM, ARGS);

    const assert = new Assert();
    assert.isEqual(
      spi.toString(),
      "StandardProgram { program: Program { code: 200,135,9, mask: Mask[0, 2, 1, ], jumpTable: JumpTable[], basicBlocks: BasicBlocks[0 -> start, ] }, memory_pages: 6, registers: 4294901760,4278059008,0,0,0,0,0,4278124544,3,0,0,0,0 }",
    );
    return assert;
  }),
];
