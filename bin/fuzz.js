#!/usr/bin/env node

// import { FuzzedDataProvider } from "@jazzer.js/core";
import { Pvm } from "@typeberry/pvm-debugger-adapter";
import { wrapAsProgram, runVm, disassemble, InputKind } from "../build/release.js";

export function fuzz(data) {
  const gas = 10n;
  const pc = 0;
  const pvm = new Pvm();
  const program = wrapAsProgram(new Uint8Array(data));

  try {
    console.log(program);
    pvm.reset(
      program,
      pc,
      gas,
    );
    pvm.run(100);

    const output = runVm({
      registers: Array(13).join(',').split(',').map(() => BigInt(0)),
      pc,
      pageMap: [],
      memory: [],
      gas,
      program,
    });

    assert(pvm.getStatus(), normalizeStatus(output.status), 'status');
    assert(pvm.getGasLeft(), output.gas, 'gas');
    assert(pvm.getRegisters().toString(), output.registers.toString(), 'registers');
    // assert(pvm.getProgramCounter(), output.pc, 'pc');
  } catch (e) {
    console.log(program);
    console.log(disassemble(Array.from(program), InputKind.Generic));
    throw e;
  }
}

function normalizeStatus(status) {
  if (status === 2) {
    return 1;
  }
  return status;
}

function assert(tb, an, comment = '') {
  if (tb !== an) {
    throw new Error(`Diverging value: (typeberry) ${tb} vs ${an} (ananas). ${comment}`);
  }
}
