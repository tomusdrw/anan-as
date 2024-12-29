import { VmInput, getAssembly, runVm } from "./api-generic";
import { decodeProgram, decodeSpi, liftBytes } from "./program";

export * from "./api";
export { runVm, getAssembly } from "./api-generic";

export enum InputKind {
  Generic = 0,
  SPI = 1,
}

export function disassemble(input: u8[], kind: InputKind): string {
  const program = liftBytes(input);
  if (kind === InputKind.Generic) {
    const p = decodeProgram(program);
    return getAssembly(p);
  }

  if (kind === InputKind.SPI) {
    const p = decodeSpi(program);
    return getAssembly(p);
  }

  return `Unknown kind: ${kind}`;
}

export function runProgram(input: u8[], kind: InputKind): void {
  if (kind === InputKind.Generic) {
    const vmInput = new VmInput();
    vmInput.registers[7] = 9;
    vmInput.gas = 10_000;
    vmInput.program = input;

    const output = runVm(vmInput, true);
    console.log(`Finished with status: ${output.status}`);
    return;
  }

  if (kind === InputKind.SPI) {
    throw new Error("SPI running not supported yet");
  }

  throw new Error(`Unknown kind: ${kind}`);
}
