#!/usr/bin/env node

import "json-bigint-patch";
import {readFileSync, readdirSync} from 'node:fs';
import {resolve, join} from 'node:path';
import * as assert from 'node:assert';

import { runVm, InputKind, disassemble } from "../build/release.js";

const OK = '🟢';
const ERR = '🔴';

// Run the CLI application
main();

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
    console.error("read from stdin: index.js [--debug] -");
    process.exit(1);
  }

  if (args[0] === '-') {
    readFromStdin(IS_DEBUG);
    return;
  }

  const status = {
    all: 0,
    ok: [],
    fail: [],
  };

  // Process each file
  args.forEach((filePath) => {
    // try whole directory
    let dir = null;
    try {
      dir = readdirSync(filePath);
    } catch (e) {
    }

    if (dir !== null) {
      status.all += dir.length;
      dir.forEach((file) => processFile(IS_DEBUG, status, join(filePath, file)));
    } else {
      status.all += 1;
      // or just process file
      processFile(IS_DEBUG, status, filePath);
      // TODO print results to stdout
    }
  });

  const icon = status.ok.length === status.all ? OK : ERR;
  console.log(`${icon} Tests status: ${status.ok.length}/${status.all}`);
  if (status.fail.length) {
    console.error('Failures:');
    for (const e of status.fail) {
      console.error(`❗ ${e.filePath} (${e.name})`);
    }
    process.exit(-1)
  }
}

function readFromStdin(debug = false) {
  process.stdin.setEncoding('utf8');
  process.stderr.write('awaiting input\n');

  // Read from stdin
  let buffer  = '';
  process.stdin.on('data', (data) => {
    buffer += data;
    if (buffer.endsWith("\n\n")) {
      const json = JSON.parse(buffer);
      const input = {
        registers: read(json, 'initial-regs').map(x => BigInt(x)),
        pc: read(json, 'initial-pc'),
        pageMap: asPageMap(read(json, 'initial-page-map')),
        memory: asChunks(read(json, 'initial-memory')),
        gas: BigInt(read(json, 'initial-gas')),
        program: read(json, 'program'),
      };
      const result = runVm(input, debug);

      json['expected-pc'] = result.pc;
      json['expected-gas'] = result.gas;
      json['expected-status'] = statusAsString(result.status);
      json['expected-regs'] = result.registers;

      console.log(JSON.stringify(json));
      console.log();
    }
  });
}

function read(data, field) {
  if (field in data) {
    return data[field];
  }
  throw new Error(`Required field ${field} missing in ${JSON.stringify(data, null, 2)}`);
}

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

function processFile(IS_DEBUG, status, filePath) {
  let jsonData;
  try {
    // Resolve the full file path
    const absolutePath = resolve(filePath);

    // Read the file synchronously
    const fileContent = readFileSync(absolutePath, 'utf-8');

    // Parse the JSON content
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    status.fail.push({ filePath, name: '<unknown>' });
    console.error(`Error reading file: ${filePath}`);
    console.error(error.message);
    return;
  }

  try {
    // Process the parsed JSON
    processJson(jsonData, IS_DEBUG);
    status.ok.push({ filePath, name: jsonData.name });
  } catch (error) {
    status.fail.push({ filePath, name: jsonData.name });
    console.error(`Error running test: ${filePath}`);
    console.error(error.message);
  }
}

