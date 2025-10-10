import { buildMemory, getAssembly, InitialChunk, InitialPage, runVm, VmInput, VmOutput } from "./api-internal";
import { BlockGasCost, computeGasCosts } from "./gas-costs";
import { MemoryBuilder } from "./memory";
import { deblob, extractCodeAndMetadata, liftBytes } from "./program";
import { NO_OF_REGISTERS, Registers } from "./registers";
import { decodeSpi, StandardProgram } from "./spi";

export enum InputKind {
  Generic = 0,
  SPI = 1,
}

export enum HasMetadata {
  Yes = 0,
  No = 1,
}

export function getGasCosts(input: u8[], kind: InputKind, withMetadata: HasMetadata): BlockGasCost[] {
  const program = prepareProgram(kind, withMetadata, input, [], [], [], []);

  return computeGasCosts(program.program).values();
}

export function disassemble(input: u8[], kind: InputKind, withMetadata: HasMetadata): string {
  const program = prepareProgram(kind, withMetadata, input, [], [], [], []);

  let output = "";
  if (withMetadata === HasMetadata.Yes) {
    output = "Metadata: \n";
    output += "0x";
    output += program.metadata.reduce((acc, x) => acc + x.toString(16).padStart(2, "0"), "");
    output += "\n\n";
  }

  output += getAssembly(program.program);

  return output;
}

export function prepareProgram(
  kind: InputKind,
  hasMetadata: HasMetadata,
  program: u8[],
  initialRegisters: u64[],
  initialPageMap: InitialPage[],
  initialMemory: InitialChunk[],
  args: u8[],
): StandardProgram {
  let code = liftBytes(program);
  let metadata = new Uint8Array(0);

  if (hasMetadata === HasMetadata.Yes) {
    const data = extractCodeAndMetadata(code);
    code = data.code;
    metadata = data.metadata;
  }

  if (kind === InputKind.Generic) {
    const program = deblob(code);

    const builder = new MemoryBuilder();
    const memory = buildMemory(builder, initialPageMap, initialMemory);

    const registers: Registers = new StaticArray(NO_OF_REGISTERS);
    for (let r = 0; r < initialRegisters.length; r++) {
      registers[r] = initialRegisters[r];
    }

    const exe: StandardProgram = new StandardProgram(program, memory, registers);
    exe.metadata = metadata;

    return exe;
  }

  if (kind === InputKind.SPI) {
    const exe = decodeSpi(code, liftBytes(args));
    exe.metadata = metadata;
    return exe;
  }

  throw new Error(`Unknown kind: ${kind}`);
}

export function runProgram(
  program: StandardProgram,
  initialGas: i64 = 0,
  programCounter: u32 = 0,
  logs: boolean = false,
  useSbrkGas: boolean = false,
): VmOutput {
  const vmInput = new VmInput(program.program, program.memory, program.registers);
  vmInput.gas = initialGas;
  vmInput.pc = programCounter;

  return runVm(vmInput, logs, useSbrkGas);
}
