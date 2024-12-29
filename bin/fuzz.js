#!/usr/bin/env node

import "json-bigint-patch";
import fs from 'node:fs';
import { Pvm } from "@typeberry/pvm-debugger-adapter";
import { wrapAsProgram, runVm, disassemble, InputKind } from "../build/release.js";

export function fuzz(data) {
  const gas = 200n;
  const pc = 0;
  const pvm = new Pvm();
  const program = wrapAsProgram(new Uint8Array(data));

  try {
    pvm.reset(
      program,
      pc,
      gas,
    );
    pvm.run(100);

    const printDebugInfo = false;
    const registers = Array(13).join(',').split(',').map(() => BigInt(0));
    const output = runVm({
      registers,
      pc,
      pageMap: [],
      memory: [],
      gas,
      program,
    }, printDebugInfo);

    assert(pvm.getStatus(), normalizeStatus(output.status), 'status');
    assert(pvm.getGasLeft(), output.gas, 'gas');
    assert(pvm.getRegisters().toString(), output.registers.toString(), 'registers');
    // assert(pvm.getProgramCounter(), output.pc, 'pc');

    writeTestCase(
      program,
      {
        pc,
        gas,
        registers,
      },
      {
        status: pvm.getStatus(),
        gasLeft: pvm.getGasLeft(),
        pc: pvm.getProgramCounter(),
        registers: pvm.getRegisters()
      },
    );
  } catch (e) {
    const hex = programHex(program);
    console.log(program);
    console.log(linkTo(hex));
    console.log(disassemble(Array.from(program), InputKind.Generic));
    throw e;
  }
}

function programHex(program) {
  return Array.from(program).map(x => x.toString(16).padStart(2, '0')).join('');
}
function linkTo(programHex) {
  return `https://deploy-preview-244--pvm-debugger.netlify.app/?program=0x${programHex}`;
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

function writeTestCase(program, initial, expected) {
  const hex = programHex(program);
  fs.writeFileSync(`../tests/length_${hex.length}/${hex}.json`, JSON.stringify({
    name: linkTo(hex),
    "initial-regs": initial.registers,
    "initial-pc": initial.pc,
    "initial-page-map": [],
    "initial-memory": [],
    "initial-gas": initial.gas,
    program: Array.from(program),
    "expected-status": statusToStr(expected.status),
    "expected-regs": Array.from(expected.registers),
    "expected-pc": expected.pc,
    "expected-gas": expected.gasLeft,
    "expected-memory": [],
  }));
}

function statusToStr(status) {
  if (status === 0) {
    return 'halt';
  }
  if (status === 1) {
    return "trap";
  }
  if (status === 4) {
    return "oog";
  }
  if (status === 3) {
    return "host";
  }

  throw new Error(`unexpected status: ${status}`);
}
