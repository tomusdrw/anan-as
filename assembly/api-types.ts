/** We split out type definitions, because they can't be exported from WASM. */

import { Status } from "./interpreter";
import { Memory } from "./memory";
import { Access } from "./memory-page";
import { Program } from "./program";
import { Registers } from "./registers";

export class ReturnValue {
  status: Status = Status.OK;
  exitCode: u32 = 0;
  pc: u32 = 0;
  gas: i64 = 0;
  result: u8[] = [];
}

export class InitialPage {
  address: u32 = 0;
  length: u32 = 0;
  access: Access = Access.None;
}
export class InitialChunk {
  address: u32 = 0;
  data: u8[] = [];
}

export class VmInput {
  pc: u32 = 0;
  gas: i64 = 0;

  constructor(
    public readonly program: Program,
    public readonly memory: Memory,
    public readonly registers: Registers,
  ) {}
}

export class VmOutput {
  status: Status = Status.OK;
  registers: u64[] = [];
  pc: u32 = 0;
  memory: InitialChunk[] = [];
  gas: i64 = 0;
  exitCode: u32 = 0;
}
