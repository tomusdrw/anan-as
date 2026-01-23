#!/usr/bin/env node

import "json-bigint-patch";
import fs from 'node:fs';
import { Interpreter } from "@typeberry/lib/pvm-interpreter";
import { tryAsGas } from "@typeberry/lib/pvm-interface";
import { wrapAsProgram, runProgram, disassemble, InputKind, prepareProgram, HasMetadata } from "../build/release.js";

let runNumber = 0;

export function fuzz(data: Uint8Array | number[]) {
  const gas = 200n;
  const pc = 0;
  const vm = new Interpreter();
  const program = wrapAsProgram(new Uint8Array(data));
  if (program.length > 100) {
    return;
  }

  try {
    vm.resetGeneric(
      program,
      pc,
      tryAsGas(gas),
    );
    vm.runProgram();

    const printDebugInfo = false;
    const registers = Array(13).join(',').split(',').map(() => BigInt(0));
    const exe = prepareProgram(
      InputKind.Generic,
      HasMetadata.No,
      Array.from(program),
      registers,
      [],
      [],
      []
    );
    const output = runProgram(exe, gas, pc, printDebugInfo);
    const vmRegisters = decodeRegistersFromTypeberry(vm);
    
    collectErrors((assertFn) => {
      assertFn(normalizeStatus(vm.getStatus()), normalizeStatus(output.status), 'status');
      assertFn(vm.gas.get(), output.gas, 'gas');
      assertFn(vmRegisters, output.registers, 'registers');
      assertFn(vm.getPC(), output.pc, 'pc');
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
            gasLeft: vm.gas.get(),
            pc: vm.getPC(),
            registers: vmRegisters,
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

function programHex(program: Uint8Array) {
  return Array.from(program).map((x: number) => x.toString(16).padStart(2, '0')).join('');
}
  
function linkTo(programHex: string) {
  return `https://pvm.fluffylabs.dev/?program=0x${programHex}#/`;
}

const REGISTER_BYTE_WIDTH = 8;

function decodeRegisters(value: Uint8Array): bigint[] {
  if (value.length === 0) {
    return [];
  }

  if (value.length % REGISTER_BYTE_WIDTH !== 0) {
    throw new Error(`Invalid register buffer size: ${value.length}`);
  }

  const view = new DataView(value.buffer, value.byteOffset, value.byteLength);
  const registerCount = value.length / REGISTER_BYTE_WIDTH;
  const registers = new Array<bigint>(registerCount);

  for (let i = 0; i < registerCount; i++) {
    registers[i] = view.getBigUint64(i * REGISTER_BYTE_WIDTH, true);
  }

  return registers;
}

function decodeRegistersFromTypeberry(vm: Interpreter): bigint[] {
  const registers: bigint[] = [];
  // Try to get up to 13 registers (common register count)
  for (let i = 0; i < 13; i++) {
    try {
      registers.push(vm.registers.getU64(i));
    } catch (e) {
      // If we can't get a register, break
      break;
    }
  }
  return registers;
}

function normalizeStatus(status: number) {
  if (status === 2) {
    return 1;
  }
  return status;
}

function assert<T>(tb: T, an: T, comment = '') {
  let condition =  tb !== an;
  if (Array.isArray(tb) && Array.isArray(an)) {
    condition = tb.toString() !== an.toString();
  }

  if (condition) {
    const alsoAsHex = (f: unknown): string => {
      if (Array.isArray(f)) {
        return `${f.map(alsoAsHex).join(', ')}`;
      }

      if (typeof f === 'number' || typeof f === 'bigint') {
        if (BigInt(f) !== 0n) {
          return `${f} | 0x${f.toString(16)}`;
        }
        return `${f}`;
      }
      return f as string;
    };

    throw new Error(`Diverging value: ${comment}
\t(typeberry) ${alsoAsHex(tb)}
\t(ananas)    ${alsoAsHex(an)}`);
  }
}

function collectErrors(cb: (assertFn: <T>(tb: T, an: T, comment?: string) => void) => void) {
  const errors: string[] = [];
  cb((tb, an, comment = '') => {
    try {
      assert(tb, an, comment);
    } catch (e) {
      errors.push(`${e}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.join('\n'));
  }
}
type InitialValues = {
  registers: bigint[],
  pc: number,
  gas: bigint,
};
type ExpectedValues = {
  status: number,
  registers: bigint[],
  pc: number,
  gasLeft: bigint,
};
function writeTestCase(program: Uint8Array, initial: InitialValues, expected: ExpectedValues) {
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

function statusToStr(status: number) {
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
