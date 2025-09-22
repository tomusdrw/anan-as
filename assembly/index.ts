import { VmInput, VmOutput, getAssembly, runVm } from "./api-generic";
import { deblob, decodeSpi, extractCodeAndMetadata, liftBytes } from "./program";

export * from "./api";
export { runVm, getAssembly } from "./api-generic";
export { wrapAsProgram } from "./program-build";

export enum InputKind {
  Generic = 0,
  SPI = 1,
}

export enum HasMetadata {
  Yes = 0,
  No = 1,
}

export enum HasArgs {
  Yes = 0,
  No = 1,
}

export function disassemble(input: u8[], kind: InputKind, withMetadata: HasMetadata, args: u8[] = []): string {
  let program = liftBytes(input);
  let output = "";

  if (withMetadata === HasMetadata.Yes) {
    const data = extractCodeAndMetadata(program);
    program = data.code;
    output = "Metadata: \n";
    output += "0x";
    output += data.metadata.reduce((acc, x) => acc + x.toString(16).padStart(2, "0"), "");
    output += "\n\n";
  }

  if (kind === InputKind.Generic) {
    const p = deblob(program);
    return output + getAssembly(p);
  }

  if (kind === InputKind.SPI) {
    const p = decodeSpi(program, liftBytes(args));
    return output + getAssembly(p);
  }

  return `Unknown kind: ${kind}`;
}

export function runProgram(input: u8[], registers: u64[], kind: InputKind): VmOutput {
  if (kind === InputKind.Generic) {
    const vmInput = new VmInput();
    vmInput.registers = registers;
    vmInput.gas = 10_000;
    vmInput.program = input;

    const output = runVm(vmInput, true);
    console.log(`Finished with status: ${output.status}`);
    return output;
  }

  if (kind === InputKind.SPI) {
    throw new Error("SPI running not supported yet");
  }

  throw new Error(`Unknown kind: ${kind}`);
}
