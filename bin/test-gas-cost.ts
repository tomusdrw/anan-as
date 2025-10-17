#!/usr/bin/env node

import "json-bigint-patch";
import * as assert from 'node:assert';
import { OK, ERR, run, read, ProcessableData, TestOptions } from './test-json.js';

import { InputKind, disassemble, HasMetadata, getGasCosts } from "../build/release.js";

// Run the CLI application
main();

type GasCostTest = {
  program: number[];
  block_gas_costs: Record<number, number>;
} & ProcessableData;

// Main function
function main() {
  const options: TestOptions = {
    isDebug: false,
    isSilent: false,
    useSbrkGas: false,
  };

  run(processGasCost, options);
}

function processGasCost(data: GasCostTest, options: TestOptions, filePath: string) {
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

  return data;
}

function asMap(costs: { pc: number, gas: bigint }[]) {
  const obj: Record<number, number> = {};
  for (const { pc, gas } of costs) {
    obj[pc] = Number(gas);
  }
  return obj;
}
