import * as bit from "./instructions/bit.test";
import * as branch from "./instructions/branch.test";
import * as logic from "./instructions/logic.test";
import * as math from "./instructions/math.test";
import * as rot from "./instructions/rot.test";
import { Test } from "./test";

export function runAllTests(): void {
  run(bit.TESTS, "bit.ts");
  run(branch.TESTS, "branch.ts");
  run(math.TESTS, "math.ts");
  run(logic.TESTS, "logic.ts");
  run(rot.TESTS, "rot.ts");
}

function run(tests: Test[], file: string): void {
  let ok = 0;
  console.log(`${file}`);
  for (let i = 0; i < tests.length; i++) {
    console.log(`  >>> ${tests[i].name}`);
    const res = tests[i].ptr();
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

  console.log("");
  const ico = ok === tests.length ? "✅" : "🔴";
  console.log(`${ok} / ${tests.length} ${ico}`);
}
