#!/usr/bin/env node

import "json-bigint-patch";
import fs from 'node:fs';
import { pvm } from "@typeberry/lib";
import { wrapAsProgram, runProgram, disassemble, InputKind, prepareProgram, HasMetadata } from "../build/release.js";

let runNumber = 0;

export function fuzz(data) {
  const gas = 200n;
  const pc = 0;
  const vm = new pvm.Pvm();
  const program = wrapAsProgram(new Uint8Array(data));
  if (program.length > 100) {
    return;
  }

  try {
    vm.reset(
      program,
      pc,
      gas,
    );
    while(vm.nSteps(100)) {}

    const printDebugInfo = false;
    const registers = Array(13).join(',').split(',').map(() => BigInt(0));
    const exe = prepareProgram(
      InputKind.Generic,
      HasMetadata.No,
      program,
      registers,
      [],
      [],
      []
    );
    const output = runProgram(exe, gas, pc, printDebugInfo);
    
    collectErrors((assert) => {
      assert(normalizeStatus(vm.getStatus()), normalizeStatus(output.status), 'status');
      assert(vm.getGasLeft(), output.gas, 'gas');
      assert(Array.from(vm.getRegisters()), output.registers, 'registers');
      assert(vm.getProgramCounter(), output.pc, 'pc');
    });

    try {
      if (runNumber % 100000 === 0) {
        writeTestCase(
          program,
          {
            pc,
            gas,
            registers,
          },
          {
            status: normalizeStatus(vm.getStatus()),
            gasLeft: vm.getGasLeft(),
            pc: vm.getProgramCounter(),
            registers: vm.getRegisters()
          },
        );
      }
    } catch (e) {
      console.warn('Unable to write file', e);
    }
  } catch (e) {
    const hex = programHex(program);
    console.log(program);
    console.log(linkTo(hex));
    console.log(disassemble(Array.from(program), InputKind.Generic, HasMetadata.No));
    throw e;
  }
}

function programHex(program) {
  return Array.from(program).map(x => x.toString(16).padStart(2, '0')).join('');
}
  
function linkTo(programHex) {
  return `https://pvm.fluffylabs.dev/?program=0x${programHex}#/`;
}

function normalizeStatus(status) {
  if (status === 2) {
    return 1;
  }
  return status;
}

function assert(tb, an, comment = '') {
  let condition =  tb !== an;
  if (Array.isArray(tb) && Array.isArray(an)) {
    condition = tb.toString() !== an.toString();
  }

  if (condition) {
    const alsoAsHex = (f) => {
      if (Array.isArray(f)) {
        return `${f.map(alsoAsHex).join(', ')}`;
      }

      if (typeof f === 'number' || typeof f === 'bigint') {
        if (BigInt(f) !== 0n) {
          return `${f} | 0x${f.toString(16)}`;
        }
        return `${f}`;
      }
      return f;
    };

    throw new Error(`Diverging value: ${comment}
\t(typeberry) ${alsoAsHex(tb)}
\t(ananas)    ${alsoAsHex(an)}`);
  }
}

function collectErrors(cb) {
  const errors = [];
  cb((...args) => {
    try {
      assert(...args);
    } catch (e) {
      errors.push(e);
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}

function writeTestCase(program, initial, expected) {
  const hex = programHex(program);
  fs.mkdirSync(`../tests/length_${hex.length}`, { recursive: true });
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
