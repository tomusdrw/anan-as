import { RELEVANT_ARGS } from "./arguments";
import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";
import { Interpreter, Status } from "./interpreter";
import { Memory, MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE, RESERVED_MEMORY } from "./memory-page";
import { Program, deblob, decodeArguments, liftBytes, resolveArguments } from "./program";
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
  exitCode: u32 = 0;
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

    const skipBytes = p.mask.skipBytesToNextInstruction(i);
    const args = decodeArguments(iData.kind, p.code.subarray(i + 1), skipBytes);
    const argsArray = [args.a, args.b, args.c, args.d];
    const relevantArgs = RELEVANT_ARGS[iData.kind];
    for (let i = 0; i < relevantArgs; i++) {
      v += ` ${argsArray[i]}, `;
    }
    i += skipBytes;
  }
  return v;
}

export function runVm(input: VmInput, logs: boolean = false, useSbrkGas: boolean = false): VmOutput {
  const p = deblob(liftBytes(input.program));

  const registers: Registers = new StaticArray(NO_OF_REGISTERS);
  for (let r = 0; r < registers.length; r++) {
    registers[r] = input.registers[r];
  }
  const builder = new MemoryBuilder();
  const memory = buildMemory(builder, input.pageMap, input.memory);

  const int = new Interpreter(p, registers, memory);
  int.useSbrkGas = useSbrkGas;
  int.nextPc = input.pc;
  int.gas.set(input.gas);

  let isOk = true;
  for (;;) {
    if (!isOk) {
      if (logs) console.log(`REGISTERS = ${registers.join(", ")} (final)`);
      if (logs) console.log(`REGISTERS = ${registers.map((x: u64) => `0x${x.toString(16)}`).join(", ")} (final)`);
      if (logs) console.log(`Finished with status: ${int.status}`);
      break;
    }

    if (logs) console.log(`PC = ${int.pc}`);
    if (logs) console.log(`STATUS = ${int.status}`);
    if (logs) console.log(`REGISTERS = ${registers.join(", ")}`);
    if (logs) console.log(`REGISTERS = ${registers.map((x: u64) => `0x${x.toString(16)}`).join(", ")}`);
    if (logs) {
      const instruction = int.pc < u32(int.program.code.length) ? int.program.code[int.pc] : 0;
      const iData = instruction >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[instruction];
      const skipBytes = p.mask.skipBytesToNextInstruction(int.pc);
      const name = changetype<string>(iData.namePtr);
      console.log(`INSTRUCTION = ${name} (${instruction})`);
      const args = resolveArguments(iData.kind, int.program.code.subarray(int.pc + 1), skipBytes, int.registers);
      if (args !== null) {
        console.log(`ARGUMENTS:
  ${args.a} (${args.decoded.a}) = 0x${u64(args.a).toString(16)}, 
  ${args.b} (${args.decoded.b}) = 0x${u64(args.b).toString(16)},
  ${args.c} (${args.decoded.c}) = 0x${u64(args.c).toString(16)},
  ${args.d} (${args.decoded.d}) = 0x${u64(args.d).toString(16)}`);
      }
    }

    isOk = int.nextStep();
  }
  const output = new VmOutput();
  output.status = int.status;
  output.registers = int.registers.slice(0);
  output.pc = int.pc;
  output.gas = int.gas.get();
  output.memory = getOutputChunks(int.memory);
  output.exitCode = int.exitCode;

  // release used pages back
  int.memory.free();

  return output;
}

export function getOutputChunks(memory: Memory): InitialChunk[] {
  const chunks: InitialChunk[] = [];
  const pages = memory.pages.keys();
  let currentChunk: InitialChunk | null = null;
  for (let i = 0; i < pages.length; i++) {
    const pageIdx = pages[i];
    const page = memory.pages.get(pageIdx);

    // skip empty pages
    if (page.raw.page === null) {
      continue;
    }

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

export function buildMemory(builder: MemoryBuilder, pages: InitialPage[], chunks: InitialChunk[]): Memory {
  let sbrkIndex = RESERVED_MEMORY;

  for (let i = 0; i < pages.length; i++) {
    const initPage = pages[i];
    builder.setData(initPage.access, initPage.address, new Uint8Array(initPage.length));
    // find the highest writeable page and set the sbrk index there.
    if (initPage.access === Access.Write) {
      sbrkIndex = initPage.address < sbrkIndex ? sbrkIndex : initPage.address;
    }
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

  return builder.build(sbrkIndex);
}
