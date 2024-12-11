#!/usr/bin/env node

// import { FuzzedDataProvider } from "@jazzer.js/core";
import { Pvm } from "@typeberry/pvm-debugger-adapter";
import { wrapAsProgram } from "../build/release.js";

export function fuzz(data) {
  const pvm = new Pvm();
  const program = wrapAsProgram(new Uint8Array(data));

  pvm.reset(
    program,
    0,
    100n
  );
  pvm.run(100);
}
