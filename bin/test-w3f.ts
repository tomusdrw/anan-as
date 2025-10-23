#!/usr/bin/env node

import "json-bigint-patch";
import * as assert from 'node:assert';
import { OK, ERR, run, read, TestOptions } from './test-json.js';

import { prepareProgram, runProgram, InputKind, disassemble, HasMetadata } from "../build/release.js";

type PvmTest = {
  "name": string;
  "initial-regs": (bigint | number)[];
  "initial-pc": number;
  "initial-page-map": Page[];
  "initial-memory": Chunk[];
  "initial-gas": bigint | number;
  "program": number[];
  "expected-regs": (bigint | number)[];
  "expected-pc": number;
  "expected-gas": bigint | number;
  "expected-status": number;
  "expected-page-fault-address"?: number;
  "expected-memory": Chunk[];
};

// Run the CLI application
main();

// Main function
function main() {
  const options: TestOptions = {
    isDebug: false,
    isSilent: false,
    useSbrkGas: false,
  };

  run<PvmTest>(processW3f, options);
}

function processW3f(data: PvmTest, options: TestOptions) {
  if (options.isDebug) {
    console.debug(`🤖 Running ${data.name}`);
  }
  // input
  const input = {
    registers: read(data, 'initial-regs').map((x: number | bigint) => BigInt(x)),
    pc: read(data, 'initial-pc'),
    pageMap: asPageMap(read(data, 'initial-page-map')),
    memory: asChunks(read(data, 'initial-memory')),
    gas: BigInt(read(data, 'initial-gas')),
    program: read(data, 'program'),
  };

  if (options.isDebug) {
    const assembly = disassemble(input.program, InputKind.Generic, HasMetadata.No);
    console.info('===========');
    console.info(assembly);
    console.info('\n^^^^^^^^^^^\n');
  }

  const exe = prepareProgram(InputKind.Generic, HasMetadata.No, input.program, input.registers, input.pageMap, input.memory, []);
  const result = runProgram(exe, input.gas, input.pc, options.isDebug, options.useSbrkGas);
  const statusStr = statusAsString(result.status);
  result.status = statusStr as any;

  // silent mode - just put our vals into expected (comparison done externally)
  if (options.isSilent) {
    data['expected-pc'] = result.pc;
    data['expected-gas'] = result.gas;
    data['expected-status'] = result.status;
    data['expected-regs'] = result.registers;
    data['expected-page-fault-address'] = result.exitCode;

    return data;
  }

  // compare with expected values
  const expected = {
    status: read(data, 'expected-status'),
    registers: read(data, 'expected-regs').map((x: any) => BigInt(x)),
    pc: read(data, 'expected-pc'),
    memory: asChunks(read(data, 'expected-memory')),
    gas: BigInt(read(data, 'expected-gas')),
    exitCode: read(data, 'expected-page-fault-address', 0) as number,
  };

  try {
    assert.deepStrictEqual(result, expected);
    console.log(`${OK} ${data.name}`);
  } catch (e) {
    console.log(`${ERR} ${data.name}`);
    throw e;
  }
  return data;
}

type Chunk = {
  address: number,
  contents?: number[],
  data: number[],
};

function asChunks(chunks: Chunk[]) {
  return chunks.map((chunk: Chunk) => {
    chunk.data = read(chunk, 'contents') as number[];
    delete chunk.contents;
    return chunk;
  });
}

type Page = {
  address: number,
  length: number,
  "is-writable": boolean,
  access: Access,
};
enum Access {
  Read = 1,
  Write = 2,
};
function asPageMap(pages: Page[]) {
  return pages.map((page: Page) => {
    page.access = read(page, 'is-writable') ? Access.Write : Access.Read;
    return page;
  });
}

function statusAsString(status: number) {
  const map: Record<number, string> = {
    255: 'ok',
    0: 'halt',
    1: 'panic',
    2: 'page-fault',
    3: 'host',
    4: 'oog'
  };

  return map[status] || `unknown(${status})`;
}

