#!/usr/bin/env node

import "json-bigint-patch";
import * as assert from 'node:assert';
import { OK, ERR, run } from './test-json.js';

import { prepareProgram, runProgram, InputKind, disassemble, HasMetadata } from "../build/release.js";

// Run the CLI application
main();

// Main function
function main() {
  const options = {
    // print some additional debug info.
    isDebug: false,
    // don't print anything (jsonin-jsonout mode)
    isSilent: false,
    // enable sbrk gas
    useSbrkGas: false,
  };

  run(processW3f, options);
}

function read(data, field, defaultValue = undefined) {
  if (field in data) {
    return data[field];
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Required field ${field} missing in ${JSON.stringify(data, null, 2)}`);
}

function processW3f(data, options) {
  if (options.isDebug) {
    console.debug(`🤖 Running ${data.name}`);
  }
  // input
  const input = {
    registers: read(data, 'initial-regs').map(x => BigInt(x)),
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
  result.status = statusAsString(result.status);

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
    registers: read(data, 'expected-regs').map(x => BigInt(x)),
    pc: read(data, 'expected-pc'),
    memory: asChunks(read(data, 'expected-memory')),
    gas: BigInt(read(data, 'expected-gas')),
    exitCode: read(data, 'expected-page-fault-address', 0),
  };

  try {
    assert.deepStrictEqual(result, expected);
    console.log(`${OK} ${data.name}`);
  } catch (e) {
    console.log(`${ERR} ${data.name}`);
    throw e;
  }
}

function asChunks(chunks) {
  return chunks.map(chunk => {
    chunk.data = read(chunk, 'contents');
    delete chunk.contents;
    return chunk;
  });
}

function asPageMap(pages) {
  return pages.map(page => {
    page.access = read(page, 'is-writable') ? 2 : 1;
    return page;
  });
}

function statusAsString(status) {
  const map = {
    255: 'ok',
    0: 'halt',
    1: 'panic',
    2: 'page-fault',
    3: 'host',
    4: 'oog'
  };

  return map[status] || `unknown(${status})`;
}

