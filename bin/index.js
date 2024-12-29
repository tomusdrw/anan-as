#!/usr/bin/env node

import "json-bigint-patch";
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import * as assert from 'node:assert';

import { runVm, InputKind, disassemble } from "../build/release.js";

function read(data, field) {
  if (field in data) {
    return data[field];
  }
  throw new Error(`Required field ${field} missing in ${JSON.stringify(data, null, 2)}`);
}

const OK = '🟢';
const ERR = '🔴';

function processJson(data, debug = false) {
  if (debug) {
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
  // expected
  const expected = {
    status: read(data, 'expected-status'),
    registers: read(data, 'expected-regs').map(x => BigInt(x)),
    pc: read(data,  'expected-pc'),
    memory: asChunks(read(data, 'expected-memory')),
    gas: BigInt(read(data, 'expected-gas')),
  };

  if (debug) {
    const assembly = disassemble(input.program, InputKind.Generic);
    console.info('===========');
    console.info(assembly);
      console.info('\n^^^^^^^^^^^\n');
  }

  const result = runVm(input, debug);
  result.status = statusAsString(result.status);

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
    1: 'trap', // panic
    2: 'trap', // page fault
    3: 'host',
    4: 'oog'
  };

  return map[status] || `unknown(${status})`;
}

// Main function
function main() {
  let IS_DEBUG = false;
  // Get the JSON file arguments from the command line
  let args = process.argv.slice(2);

  if (args[0] === '--debug') {
    args.shift();
    IS_DEBUG = true;
  }

  if (args.length === 0) {
    console.error("Error: No JSON files provided.");
    console.error("Usage: index.js [--debug] <file1.json> [file2.json ...]");
    process.exit(1);
  }

  const status = {
    all: args.length,
    ok: [],
    fail: [],
  };

  // Process each file
  args.forEach((filePath) => {
    let jsonData;
    try {
      // Resolve the full file path
      const absolutePath = resolve(filePath);

      // Read the file synchronously
      const fileContent = readFileSync(absolutePath, 'utf-8');

      // Parse the JSON content
      jsonData = JSON.parse(fileContent);
    } catch (error) {
      status.fail.push(filePath);
      console.error(`Error reading file: ${filePath}`);
      console.error(error.message);
      return;
    }

    try {
      // Process the parsed JSON
      processJson(jsonData, IS_DEBUG);
      status.ok.push(filePath);
    } catch (error) {
      status.fail.push(filePath);
      console.error(`Error running test: ${filePath}`);
      console.error(error.message);
    }
  });

  const icon = status.ok.length === status.all ? OK : ERR;
  console.log(`${icon} Tests status: ${status.ok.length}/${status.all}`);
  if (status.fail.length) {
    console.error('Failures:');
    for (const e of status.fail) {
      console.error(`❗ ${e}`);
    }
    process.exit(-1)
  }
}

// Run the CLI application
main();
