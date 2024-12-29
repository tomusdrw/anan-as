import { RELEVANT_ARGS } from "./arguments";
import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";
import { Interpreter, Status } from "./interpreter";
import { Memory, MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE } from "./memory-page";
import { Program, decodeArguments, decodeProgram, liftBytes } from "./program";
import { NO_OF_REGISTERS, Registers } from "./registers";

export class InitialPage {
  address: u32 = 0;
  length: u32 = 0;
  access: Access = Access.None;
}
export class InitialChunk {
  address: u32 = 0;
  data: u8[] = [];
}

export class VmInput {
  registers: u64[] = new Array<u64>(NO_OF_REGISTERS).fill(0);
  pc: u32 = 0;
  gas: i64 = 0;
  program: u8[] = [];
  pageMap: InitialPage[] = [];
  memory: InitialChunk[] = [];
}

export class VmOutput {
  status: Status = Status.OK;
  registers: u64[] = [];
  pc: u32 = 0;
  memory: InitialChunk[] = [];
  gas: i64 = 0;
}

export function getAssembly(p: Program): string {
  const len = p.code.length;
  if (len === 0) {
    return "<seems that there is no code>";
  }

  let v = "";
  for (let i = 0; i < len; i++) {
    if (!p.mask.isInstruction(i)) {
      throw new Error("We should iterate only over instructions!");
    }

    const instruction = p.code[i];

    const iData = instruction >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[instruction];

    v += "\n";
    v += changetype<string>(iData.namePtr);
    v += `(${instruction})`;

    const argsLen = p.mask.argsLen(i);
    const end = i + 1 + argsLen;
    if (end > len) {
      const name = changetype<string>(iData.namePtr);
      const intro = "Invalid program - code is not long enough";
      throw new Error(`${intro} Expected: ${argsLen} for ${name} at ${i} (${end} > ${len})`);
    }

    const args = decodeArguments(iData.kind, p.code.subarray(i + 1, end));
    const argsArray = [args.a, args.b, args.c, args.d];
    const relevantArgs = RELEVANT_ARGS[iData.kind];
    for (let i = 0; i < relevantArgs; i++) {
      v += ` ${argsArray[i]}, `;
    }
    i += argsLen;
  }
  return v;
}

export function runVm(input: VmInput, logs: boolean = false): VmOutput {
  const p = decodeProgram(liftBytes(input.program));

  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  for (let r = 0; r < registers.length; r++) {
    registers[r] = input.registers[r];
  }
  const memory = buildMemory(input.pageMap, input.memory);

  const int = new Interpreter(p, registers, memory);
  int.nextPc = -1;
  int.gas.set(input.gas);

  let isOk = true;
  for (;;) {
    if (!isOk) {
      if (logs) console.log(`REGISTERS = ${registers.join(", ")} (final)`);
      if (logs) console.log(`Finished with status: ${int.status}`);
      break;
    }

    if (logs) console.log(`PC = ${int.pc}`);
    if (logs) console.log(`STATUS = ${int.status}`);
    if (logs) console.log(`REGISTERS = ${registers.join(", ")}`);
    if (logs && int.pc < u32(int.program.code.length)) {
      const name = changetype<string>(INSTRUCTIONS[int.program.code[int.pc]].namePtr);
      console.log(`INSTRUCTION = ${name} (${int.program.code[int.pc]})`);
    }

    isOk = int.nextStep();
  }
  const output = new VmOutput();
  output.status = int.status;
  output.registers = int.registers.slice(0);
  output.pc = int.pc;
  output.gas = int.gas.get();
  output.memory = getOutputChunks(int.memory);
  return output;
}

export function getOutputChunks(memory: Memory): InitialChunk[] {
  const chunks: InitialChunk[] = [];
  const pages = memory.pages.keys();
  let currentChunk: InitialChunk | null = null;
  for (let i = 0; i < pages.length; i++) {
    const pageIdx = pages[i];
    const page = memory.pages.get(pageIdx);

    for (let n = 0; n < page.raw.data.length; n++) {
      const v = page.raw.data[n];
      if (v !== 0) {
        if (currentChunk !== null) {
          currentChunk.data.push(v);
        } else {
          currentChunk = new InitialChunk();
          currentChunk.address = pageIdx * PAGE_SIZE + n;
          currentChunk.data = [v];
        }
      } else if (currentChunk !== null) {
        chunks.push(currentChunk);
        currentChunk = null;
      }
    }
  }
  if (currentChunk !== null) {
    chunks.push(currentChunk);
  }
  return chunks;
}

export function buildMemory(pages: InitialPage[], chunks: InitialChunk[]): Memory {
  const builder = new MemoryBuilder();
  for (let i = 0; i < pages.length; i++) {
    const initPage = pages[i];
    builder.setData(initPage.access, initPage.address, new Uint8Array(initPage.length));
  }

  for (let i = 0; i < chunks.length; i++) {
    const initChunk = chunks[i];
    // access should not matter now, since we created the pages already.
    const data = new Uint8Array(initChunk.data.length);
    for (let i = 0; i < data.length; i++) {
      data[i] = initChunk.data[i];
    }
    builder.setData(Access.None, initChunk.address, data);
  }

  return builder.build(0);
}
