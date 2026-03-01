import { InitialChunk, InitialPage, VmInput, VmOutput, VmRunOptions } from "./api-types";
import { Args, RELEVANT_ARGS } from "./arguments";
import { FastInterpreter } from "./fast-interpreter";
import { INSTRUCTIONS, MISSING_INSTRUCTION } from "./instructions";
import { Interpreter, Status } from "./interpreter";
import { MaybePageFault, Memory, MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE, RESERVED_MEMORY } from "./memory-page";
import { portable } from "./portable";
import { decodeArguments, PrecompiledProgram, Program, resolveArguments } from "./program";
import { Pvm } from "./pvm";
import { Registers } from "./registers";

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
    v += iData.name;
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

export function buildMemory(builder: MemoryBuilder, pages: InitialPage[], chunks: InitialChunk[]): Memory {
  let sbrkIndex = RESERVED_MEMORY;

  for (let i = 0; i < pages.length; i++) {
    const initPage = pages[i];
    builder.setData(initPage.access, initPage.address, new Uint8Array(initPage.length));
    // find the highest writeable page and set the sbrk index to the end of that range.
    if (initPage.access === Access.Write) {
      const pageEnd = initPage.address + initPage.length;
      sbrkIndex = pageEnd < sbrkIndex ? sbrkIndex : pageEnd;
    }
  }

  for (let i = 0; i < chunks.length; i++) {
    const initChunk = chunks[i];
    // access should not matter now, since we created the pages already.
    const data = new Uint8Array(initChunk.data.length);
    for (let j = 0; j < data.length; j++) {
      data[j] = initChunk.data[j];
    }
    builder.setData(Access.None, initChunk.address, data);
    // consider initialized chunk lengths when setting sbrk index
    const chunkEnd = initChunk.address + initChunk.data.length;
    sbrkIndex = chunkEnd < sbrkIndex ? sbrkIndex : chunkEnd;
  }

  return builder.build(sbrkIndex);
}

/** Initialize new VM for execution. */
export function vmInit(input: VmInput): Pvm {
  const int = new Interpreter(input.program, input.registers, input.memory);
  int.nextPc = input.pc;
  int.gas.set(input.gas);
  return int;
}

/** Initialize new FastInterpreter VM from a PrecompiledProgram. */
export function vmInitFast(precompiled: PrecompiledProgram, registers: Registers, memory: Memory): Pvm {
  const int = new FastInterpreter(precompiled, registers, memory);
  return int;
}

/** Initialize & run & destroy a VM in a single go. */
export function vmRunOnce(input: VmInput, options: VmRunOptions): VmOutput {
  const int = vmInit(input);
  vmExecute(int, options.logs);
  return vmDestroy(int, options.dumpMemory);
}

export function vmExecute(int: Pvm, logs: boolean = false): void {
  // Fast path: run all steps at once when logging is disabled
  if (!logs) {
    while (int.nextSteps(u32.MAX_VALUE)) {}
    return;
  }

  let isOk = true;
  const argsRes = new Args();

  for (;;) {
    if (!isOk) {
      console.log(`REGISTERS (final) = [${int.registers.map((x: u64) => `${x} (0x${x.toString(16)})`).join(", ")}]`);
      console.log(`Finished with status: ${int.status}`);
      console.log(`Exit code: ${int.exitCode}`);
      break;
    }

    console.log(`PC = ${int.pc}`);
    console.log(`GAS = ${int.gas.get()}`);
    console.log(`STATUS = ${int.status}`);
    console.log(`REGISTERS = [${int.registers.map((x: u64) => `${x} (0x${x.toString(16)})`).join(", ")}]`);

    if (int.pc < u32(int.program.code.length)) {
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

    isOk = int.nextSteps(1);
  }
}

/** Destroy a running VM and consume the output. */
export function vmDestroy(int: Pvm, dumpMemory: boolean = false): VmOutput {
  const output = new VmOutput();
  output.status = int.status;
  output.registers = int.registers.slice(0);
  output.pc = int.pc;
  output.gas = int.gas.get();
  if (dumpMemory) {
    output.memory = getOutputChunks(int.memory);
  }
  output.exitCode = int.exitCode;
  output.result = readResult(int);

  int.memory.free();
  return output;
}

function readResult(int: Pvm): u8[] {
  if (int.status !== Status.HALT) {
    return [];
  }

  // JAM return convention
  const ptr_start = u32(int.registers[7] & u64(0xffff_ffff));
  const ptr_end = u32(int.registers[8] & u64(0xffff_ffff));

  // invalid output result
  if (ptr_start >= ptr_end) {
    return [];
  }

  // attempt to read the output memory (up to 1MB)
  const totalLength = ptr_end - ptr_start;
  if (totalLength > 1_024 * 1_024) {
    return [];
  }

  const result = new Uint8Array(totalLength);
  const faultRes = new MaybePageFault();
  int.memory.bytesRead(faultRes, ptr_start, result, 0);
  // we couldn't access the mem - i.e. no output
  if (faultRes.isFault) {
    return [];
  }

  // copy the Uint8Array to a regular array
  const out = new Array<u8>(totalLength);
  for (let i: u32 = 0; i < totalLength; i++) {
    out[i] = result[i];
  }
  return out;
}

function getOutputChunks(memory: Memory): InitialChunk[] {
  const chunks: InitialChunk[] = [];
  // @ts-ignore: AS returns T[], JS returns iterator - asArray handles both
  const pages: u32[] = portable.asArray<u32>(memory.pages.keys());
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
