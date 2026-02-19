import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";
import { portable } from "./portable";
import { Program } from "./program";

export class BlockGasCost {
  pc: u32 = 0;
  gas: u64 = u64(0);
}

export function computeGasCosts(p: Program): Map<u32, BlockGasCost> {
  const len = p.code.length;
  const blocks: Map<u32, BlockGasCost> = new Map();
  let currentBlock: BlockGasCost | null = null;

  for (let i = 0; i < len; i++) {
    if (!p.mask.isInstruction(i)) {
      throw new Error("We should iterate only over instructions!");
    }

    const instruction = p.code[i];
    const iData = instruction >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[instruction];

    if (p.basicBlocks.isStart(i)) {
      if (currentBlock !== null) {
        blocks.set(currentBlock.pc, currentBlock);
      }
      currentBlock = new BlockGasCost();
      currentBlock.pc = i;
    }

    if (currentBlock !== null) {
      // add gas for current instruction
      currentBlock.gas = portable.u64_add(currentBlock.gas, iData.gas);
    }

    // move forward
    const skipBytes = p.mask.skipBytesToNextInstruction(i);
    i += skipBytes;
  }

  // add the final block
  if (currentBlock !== null) {
    blocks.set(currentBlock.pc, currentBlock);
  }

  return blocks;
}
