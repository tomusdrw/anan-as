#!/usr/bin/env node

import "json-bigint-patch";
import * as assert from 'node:assert';
import { OK, ERR, run, read } from './test-json.js';

import { InputKind, disassemble, HasMetadata, getGasCosts } from "../build/release.js";

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

  run(processGasCost, options);
}

function processGasCost(data, options, filePath) {
  if (options.isDebug) {
    console.info(`🤖 reading ${filePath}`);
  }
  // input
  const input = {
    program: read(data, 'program'),
    blockGasCosts: read(data, 'block_gas_costs'),
  };

  if (options.isDebug) {
    const assembly = disassemble(input.program, InputKind.Generic, HasMetadata.No);
    console.info('===========');
    console.info(assembly);
    console.info('\n^^^^^^^^^^^\n');
  }

  const result = asMap(getGasCosts(input.program, InputKind.Generic, HasMetadata.No));

  // silent mode - just put our vals into expected (comparison done externally)
  if (options.isSilent) {
    data['block_gas_costs'] = result;
    if (filePath !== '-') {
      console.log(JSON.stringify(data, null, 2));
    }
    return data;
  }

  try {
    assert.deepStrictEqual(result, input.blockGasCosts);
    console.log(`${OK} ${filePath}`);
  } catch (e) {
    console.log(`${ERR} ${filePath}`);
    throw e;
  }
}

function asMap(costs) {
  const obj = {};
  for (const { pc, gas } of costs) {
    obj[pc] = Number(gas);
  }
  return obj;
}
