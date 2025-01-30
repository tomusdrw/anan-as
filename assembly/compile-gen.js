#!/usr/bin/env node

// generate files that produce a compiled version
import {readFileSync, writeFileSync, readdirSync} from 'node:fs';

main();

function main() {
  // instructions-compile
  const exe = 
    read('./instructions-exe.ts')
    .replace('RUN', 'COMPILE')
  write('./compile/instructions.ts', exe);
  // instruction files
  const files = readdirSync('./instructions')
    .filter(x => !x.endsWith('.test.ts'));

  for (const f of files) {
    let c = read(`./instructions/${f}`);
    if (f === 'outcome.ts' || f === 'utils.ts') {
      c = c.replace(/\(args: Args.*/, '(context: CompileContext, args: Args) => void');
      c = c.replace(/"\.\.\//g, '"../../');
      c = 'import {CompileContext} from "../context";\n\n' + c;
    } else {
      // make sure we get the context parameter
      c = c.replace(/\(args[,)].*/g, '(ctx, args) => {');
      c = c.replace(/\(\) =>/g, '(ctx) =>');
      // now replace all content
      const regex = /({\n)(.*?)(\n};)/gs;
      c = c.replace(regex, (match, start, content, end) => {
        return replaceWithCompiled(match, start, content, end);
      });
    }
    write(`./compile/instructions/${f}`, c);
  }
}


function replaceWithCompiled(_match, start, content, end) {
  const contentArray = content.split('\n')
  const newContent = contentArray
    .map(x => {
      x = x.replace(/registers/g, 'regs');
      x = x.replace(/regs\[/g, 'regs[${');
      x = x.replace(/\]/g, '}]');
      x = x.replace(/u32SignExtend\((args.[^>]?)\)/g, '${u32SignExtend($1)}');
      if (x.indexOf('return') !== -1) {
        if (x.indexOf('ok()') !== -1) {
          return '';
        } else {
          // returns processed in context
          x = `ctx.${x.replace(/^\s*return /g, '')}`;
          // args to okOrFault should be stringified
          x = x.replace(/okOrFault\((.*?)\)/, 'okOrFault("$1")');
          x = x.replace(/dJump\((.*?)\)/, 'dJump("$1")');
          return x;
        }
      }
      return `  ctx.addBlockLine(\`${x}\`, args);`;
    })
    .filter(x => x.length > 0)
    .join('\n');

  return `${start}${newContent}\n${end}`;
}


function read(path) {
  return readFileSync(path, 'utf8');
}
function write(path, content) {
  const v = '// This file is auto-generated, take a look at compile-gen.js\n\n';
  return writeFileSync(path, v + content);
}
