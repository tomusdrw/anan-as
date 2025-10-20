#!/usr/bin/env node

import "json-bigint-patch";
import fs from "node:fs";
import { pvm } from "@typeberry/lib";
import { disassemble, HasMetadata, InputKind, prepareProgram, runProgram, wrapAsProgram } from "../build/release.js";

const runNumber = 0;

export function fuzz(data: Uint8Array | number[]) {
  const gas = 200n;
  const pc = 0;
  const vm = new pvm.Pvm();
  const program = wrapAsProgram(new Uint8Array(data));
  if (program.length > 100) {
    return;
  }

  try {
    vm.reset(program, pc, gas);
    while (vm.nSteps(100)) {}

    const printDebugInfo = false;
    const registers = Array(13)
      .join(",")
      .split(",")
      .map(() => BigInt(0));
    const exe = prepareProgram(InputKind.Generic, HasMetadata.No, Array.from(program), registers, [], [], []);
    const output = runProgram(exe, gas, pc, printDebugInfo);

    collectErrors((assertFn) => {
      assertFn(normalizeStatus(vm.getStatus()), normalizeStatus(output.status), "status");
      assertFn(vm.getGasLeft(), output.gas, "gas");
      assertFn(Array.from(vm.getRegisters()), output.registers, "registers");
      assertFn(vm.getProgramCounter(), output.pc, "pc");
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
            registers: Array.from(vm.getRegisters()),
          },
        );
      }
    } catch (e) {
      console.warn("Unable to write file", e);
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
  return Array.from(program)
    .map((x: number) => x.toString(16).padStart(2, "0"))
    .join("");
}

function linkTo(programHex: string) {
  return `https://pvm.fluffylabs.dev/?program=0x${programHex}#/`;
}

function normalizeStatus(status: number) {
  if (status === 2) {
    return 1;
  }
  return status;
}

function assert<T>(tb: T, an: T, comment = "") {
  let condition = tb !== an;
  if (Array.isArray(tb) && Array.isArray(an)) {
    condition = tb.toString() !== an.toString();
  }

  if (condition) {
    const alsoAsHex = (f: unknown): string => {
      if (Array.isArray(f)) {
        return `${f.map(alsoAsHex).join(", ")}`;
      }

      if (typeof f === "number" || typeof f === "bigint") {
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
  cb((tb, an, comment = "") => {
    try {
      assert(tb, an, comment);
    } catch (e) {
      errors.push(`${e}`);
    }
  });

  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }
}
type InitialValues = {
  registers: bigint[];
  pc: number;
  gas: bigint;
};
type ExpectedValues = {
  status: number;
  registers: bigint[];
  pc: number;
  gasLeft: bigint;
};
function writeTestCase(program: Uint8Array, initial: InitialValues, expected: ExpectedValues) {
  const hex = programHex(program);
  fs.mkdirSync(`../tests/length_${hex.length}`, { recursive: true });
  fs.writeFileSync(
    `../tests/length_${hex.length}/${hex}.json`,
    JSON.stringify({
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
    }),
  );
}

function statusToStr(status: number) {
  if (status === 0) {
    return "halt";
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
