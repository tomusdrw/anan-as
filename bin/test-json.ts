#!/usr/bin/env node

import "json-bigint-patch";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const OK = "🟢";
export const ERR = "🔴";

export type ProcessableData = {
  name?: string;
};

export interface TestOptions {
  /** print some additional debug info. */
  isDebug: boolean;
  /** don't print anything (jsonin-jsonout mode) */
  isSilent: boolean;
  /** enable sbrk gas */
  useSbrkGas: boolean;
}

type ProcessJsonFn<T extends ProcessableData> = (data: T, options: TestOptions, filePath: string) => T;

interface TestStatus {
  all: number;
  ok: Array<{ filePath: string; name: string }>;
  fail: Array<{ filePath: string; name: string }>;
}

// Main function
export function run<T extends ProcessableData>(processJson: ProcessJsonFn<T>, options: TestOptions) {
  // Get the JSON file arguments from the command line
  const args = process.argv.slice(2);

  for (;;) {
    if (args.length === 0) {
      break;
    }
    if (args[0] === "--debug") {
      args.shift();
      options.isDebug = true;
    } else if (args[0] === "--sbrk-gas") {
      args.shift();
      options.useSbrkGas = true;
    } else {
      break;
    }
  }

  if (args.length === 0) {
    console.error("Error: No JSON files provided.");
    console.error("Usage: index.js [--debug] [--sbrk-gas] <file1.json> [file2.json ...]");
    console.error("read from stdin: index.js [--debug] [--sbrk-gas] -");
    process.exit(1);
  }

  if (args[0] === "-") {
    if (options.isDebug) {
      throw new Error("debug needs to be disabled!");
    }
    readFromStdin(processJson, options);
    return;
  }

  const status: TestStatus = {
    all: 0,
    ok: [],
    fail: [],
  };

  // Process each file
  args.forEach((filePath) => {
    // try whole directory
    let dir: string[] | null = null;
    try {
      dir = readdirSync(filePath);
    } catch {
      // Not a directory or inaccessible, will try as file
    }

    if (dir !== null) {
      status.all += dir.length;
      for (const file of dir) {
        processFile(processJson, options, status, join(filePath, file));
      }
    } else {
      status.all += 1;
      // or just process file
      processFile(processJson, options, status, filePath);
      // TODO print results to stdout
    }
  });

  if (!options.isSilent) {
    const icon = status.ok.length === status.all ? OK : ERR;
    console.log(`${icon} Tests status: ${status.ok.length}/${status.all}`);
  }
  if (status.fail.length) {
    console.error("Failures:");
    for (const e of status.fail) {
      console.error(`❗ ${e.filePath} (${e.name})`);
    }
    process.exit(-1);
  }
}

function readFromStdin<T extends ProcessableData>(processJson: ProcessJsonFn<T>, options: TestOptions) {
  process.stdin.setEncoding("utf8");
  process.stderr.write("awaiting input\n");
  options.isSilent = true;

  // Read from stdin
  let buffer = "";
  process.stdin.on("data", (data) => {
    buffer += data;
    if (buffer.endsWith("\n\n")) {
      const json = JSON.parse(buffer);
      const out = processJson(json, options, "-");
      // clear previous buffer
      buffer = "";

      console.log(JSON.stringify(out));
      console.log();
    }
  });
}

function processFile<T extends ProcessableData>(
  processJson: ProcessJsonFn<T>,
  options: TestOptions,
  status: TestStatus,
  filePath: string,
) {
  let jsonData: T;
  try {
    // Resolve the full file path
    const absolutePath = resolve(filePath);

    // Read the file synchronously
    const fileContent = readFileSync(absolutePath, "utf-8");

    // Parse the JSON content
    jsonData = JSON.parse(fileContent);
  } catch (error) {
    status.fail.push({ filePath, name: "<unknown>" });
    console.error(`Error reading file: ${filePath}`);
    console.error((error as Error).message);
    return;
  }

  try {
    // Process the parsed JSON
    const result = processJson(jsonData, options, filePath);
    status.ok.push({ filePath, name: jsonData.name ?? filePath });
    return result;
  } catch (error) {
    status.fail.push({ filePath, name: jsonData.name ?? filePath });
    console.error(`Error running test: ${filePath}`);
    console.error((error as Error).message);
    return {};
  }
}

export function read<T extends object, K extends keyof T>(
  data: T,
  field: string & K,
  defaultValue: T[K] | undefined = undefined,
): T[K] {
  if (field in data) {
    return data[field];
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(`Required field ${field} missing in ${JSON.stringify(data, null, 2)}`);
}
