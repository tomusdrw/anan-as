import { InitialChunk, InitialPage, VmInput, VmOutput } from "./api-types";
import { Args, RELEVANT_ARGS } from "./arguments";
import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";
import { Interpreter, Status } from "./interpreter";
import { MaybePageFault, Memory, MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE, RESERVED_MEMORY } from "./memory-page";
import { decodeArguments, Program, resolveArguments } from "./program";

export function getAssembly(p: Program): string {
  const len = p.code.length;
  if (len === 0) {
    return "<seems that there is no code>";
  }

  let v = "";
  const argsRes = new Args();
  for (let i = 0; i < len; i++) {
    if (!p.mask.isInstruction(i)) {
      throw new Error("We should iterate only over instructions!");
    }

    const instruction = p.code[i];

    const iData = instruction >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[instruction];

    v += "\n";
    v += `${i}: `;
    v += changetype<string>(iData.namePtr);
    v += `(${instruction})`;

    const skipBytes = p.mask.skipBytesToNextInstruction(i);
    const args = decodeArguments(argsRes, iData.kind, p.code, i + 1, skipBytes);
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
  const int = new Interpreter(input.program, input.registers, input.memory);
  int.useSbrkGas = useSbrkGas;
  int.nextPc = input.pc;
  int.gas.set(input.gas);

  executeProgram(int, logs);

  const output = new VmOutput();
  output.status = int.status;
  output.registers = int.registers.slice(0);
  output.pc = int.pc;
  output.gas = int.gas.get();
  output.memory = getOutputChunks(int.memory);
  output.exitCode = int.exitCode;
  output.result = readResult(int);

  int.memory.free();
  return output;
}

function readResult(int: Interpreter): u8[] {
  if (int.status !== Status.HALT) {
    return [];
  }

  // JAM return convention
  const ptr_start = u32(int.registers[7] & 0xffff_ffff);
  const ptr_end = u32(int.registers[8] & 0xffff_ffff);

  // invalid output result
  if (ptr_start >= ptr_end) {
    return [];
  }

  // attempt to read the output memory
  const totalLength = i32(ptr_end - ptr_start);
  const result = new Uint8Array(totalLength);
  const faultRes = new MaybePageFault();
  int.memory.bytesRead(faultRes, ptr_start, result, 0);
  // we couldn't access the mem - i.e. no output
  if (faultRes.isFault) {
    return [];
  }

  // copy the Uint8Array to a regular array
  const out = new Array<u8>(totalLength);
  for (let i = 0; i < totalLength; i++) {
    out[i] = result[i];
  }
  return out;
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

function executeProgram(int: Interpreter, logs: boolean = false): void {
  let isOk = true;
  const argsRes = new Args();

  for (;;) {
    if (!isOk) {
      if (logs) console.log(`REGISTERS = ${int.registers.join(", ")} (final)`);
      if (logs) console.log(`REGISTERS = ${int.registers.map((x: u64) => `0x${x.toString(16)}`).join(", ")} (final)`);
      if (logs) console.log(`Finished with status: ${int.status}`);
      if (logs) console.log(`Exit code: ${int.exitCode}`);
      break;
    }

    if (logs) console.log(`PC = ${int.pc}`);
    if (logs) console.log(`GAS = ${int.gas.get()}`);
    if (logs) console.log(`STATUS = ${int.status}`);
    if (logs) console.log(`REGISTERS = ${int.registers.join(", ")}`);
    if (logs) console.log(`REGISTERS = ${int.registers.map((x: u64) => `0x${x.toString(16)}`).join(", ")}`);

    if (logs && int.pc < u32(int.program.code.length)) {
      const instruction = int.program.code[int.pc];
      const iData = instruction >= <u8>INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[instruction];
      const skipBytes = int.program.mask.skipBytesToNextInstruction(int.pc);
      const args = resolveArguments(argsRes, iData.kind, int.program.code, int.pc + 1, skipBytes, int.registers);
      if (args !== null) {
        console.log(`ARGUMENTS:
  ${args.a} (${args.decoded.a}) = 0x${u64(args.a).toString(16)},
  ${args.b} (${args.decoded.b}) = 0x${u64(args.b).toString(16)},
  ${args.c} (${args.decoded.c}) = 0x${u64(args.c).toString(16)},
  ${args.d} (${args.decoded.d}) = 0x${u64(args.d).toString(16)}`);
      }
    }

    isOk = int.nextSteps();
  }
}
