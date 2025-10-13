#!/usr/bin/env node

import fs from 'node:fs';
import { InputKind, disassemble } from "../build/release.js";

main();

function main() {
  const args = process.argv.slice(2);

  let kind = InputKind.Generic;
  if (args.length > 0 && args[0] === '--spi') {
    args.shift();
    kind = InputKind.SPI;
  }

  if (args.length === 0) {
    console.error("Error: No PVM files provided.");
    console.error("Usage: disassemble.js [--spi] <file1.pvm> [file2.pvm ...]");
    process.exit(1);
  }


  args.forEach(arg => {
    const f = fs.readFileSync(arg);
    const name = kind === InputKind.Generic ? 'generic PVM' : 'JAM SPI';
    console.log(`🤖 Assembly of ${arg} (as ${name})`);
    console.log(disassemble(Array.from(f), kind));
  });
}
