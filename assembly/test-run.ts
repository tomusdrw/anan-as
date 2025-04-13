import * as bit from "./instructions/bit.test";
import * as branch from "./instructions/branch.test";
import * as logic from "./instructions/logic.test";
import * as math from "./instructions/math.test";
import * as rot from "./instructions/rot.test";
import * as memory from "./memory.test";
import * as program from "./program.test";
import { Assert, Test } from "./test";

export function runAllTests(): void {
  let a: u64 = 0;

  a += run(bit.TESTS, "bit.ts");
  a += run(branch.TESTS, "branch.ts");
  a += run(logic.TESTS, "logic.ts");
  a += run(math.TESTS, "math.ts");
  a += run(memory.TESTS, "memory.ts");
  a += run(program.TESTS, "program.ts");
  a += run(rot.TESTS, "rot.ts");

  const okay = u32(a >> 32);
  const total = u32(a);

  printSummary("\n\nTotal", okay, total);
  if (okay !== total) {
    throw new Error("Some tests failed.");
  }
}

function run(tests: Test[], file: string): u64 {
  let ok = 0;
  console.log(`> ${file}`);
  for (let i = 0; i < tests.length; i++) {
    console.log(`  >>> ${tests[i].name}`);
    const res = tests[i].ptr(new Assert());
    if (res.isOkay) {
      console.log(`  <<< ${tests[i].name} ✅`);
      ok += 1;
    } else {
      for (let i = 0; i < res.errors.length; i++) {
        console.log(`    ${res.errors[i]}`);
      }
      console.log(`  <<< ${tests[i].name} 🔴`);
    }
  }

  printSummary(`< ${file}`, ok, tests.length);

  return (u64(ok) << 32) + tests.length;
}

function printSummary(msg: string, okay: u32, total: u32): void {
  const ico = okay === total ? "✅" : "🔴";
  console.log(`${msg} ${okay} / ${total} ${ico}`);
}
