#!/usr/bin/env node

import "json-bigint-patch";
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import * as assert from 'node:assert';

import { prepareProgram, runProgram, InputKind, disassemble, HasMetadata } from "../build/release.js";

const OK = '🟢';
const ERR = '🔴';

// Run the CLI application
main();

// Main function
function main() {
  const options = {
    isDebug: false,
    useSbrkGas: false,
  };

  // Get the JSON file arguments from the command line
  let args = process.argv.slice(2);

  for (; ;) {
    if (args.length === 0) {
      break;
    }
    if (args[0] === '--debug') {
      args.shift();
      options.isDebug = true;
    } else if (args[0] === '--sbrk-gas') {
      args.shift();
      options.useSbrkGas = true;
    } else {
      break;
    }
  }

  if (args.length === 0) {
    console.error("Error: No JSON files provided.");
    console.error("Usage: index.js [--debug] <file1.json> [file2.json ...]");
    console.error("read from stdin: index.js [--debug] -");
    process.exit(1);
  }

  if (args[0] === '-') {
    readFromStdin(options);
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
      dir.forEach((file) => processFile(options, status, join(filePath, file)));
    } else {
      status.all += 1;
      // or just process file
      processFile(options, status, filePath);
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

function readFromStdin(options) {
  process.stdin.setEncoding('utf8');
  process.stderr.write('awaiting input\n');

  // Read from stdin
  let buffer = '';
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
      const result = runVm(input, options.isDebug, options.useSbrkGas);

      json['expected-pc'] = result.pc;
      json['expected-gas'] = result.gas;
      json['expected-status'] = statusAsString(result.status);
      json['expected-regs'] = result.registers;
      json['expected-page-fault-address'] = result.exitCode;
      // clear previous buffer
      buffer = '';

      console.log(JSON.stringify(json));
      console.log();
    }
  });
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

function processJson(data, options) {
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
  // expected
  const expected = {
    status: read(data, 'expected-status'),
    registers: read(data, 'expected-regs').map(x => BigInt(x)),
    pc: read(data, 'expected-pc'),
    memory: asChunks(read(data, 'expected-memory')),
    gas: BigInt(read(data, 'expected-gas')),
    exitCode: read(data, 'expected-page-fault-address', 0),
  };

  if (options.isDebug) {
    const assembly = disassemble(input.program, InputKind.Generic, HasMetadata.No);
    console.info('===========');
    console.info(assembly);
    console.info('\n^^^^^^^^^^^\n');
  }

  const exe = prepareProgram(InputKind.Generic, HasMetadata.No, input.program, input.registers, input.pageMap, input.memory, []);
  const result = runProgram(exe, input.gas, 0, options.isDebug, options.useSbrkGas);
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
    1: 'panic', // panic
    2: 'page-fault', // page fault
    3: 'host',
    4: 'oog'
  };

  return map[status] || `unknown(${status})`;
}

function processFile(options, status, filePath) {
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
    processJson(jsonData, options);
    status.ok.push({ filePath, name: jsonData.name });
  } catch (error) {
    status.fail.push({ filePath, name: jsonData.name });
    console.error(`Error running test: ${filePath}`);
    console.error(error.message);
  }
}

