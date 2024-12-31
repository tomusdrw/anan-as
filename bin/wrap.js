#!/usr/bin/env node

// wrap input as program

import { wrapAsProgram } from "../build/release.js";

const program = wrapAsProgram(new Uint8Array([

]));

console.log(program);
