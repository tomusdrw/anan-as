import "json-bigint-patch";
import * as assert from "node:assert";
import { ERR, OK, read, run, TestOptions } from "../bin/src/test-json.js";

/** The subset of PVM exports needed by the test runner. */
export interface PvmModule {
  // biome-ignore lint/suspicious/noExplicitAny: both WASM and portable builds have different concrete types
  disassemble: (program: any, kind: any, hasMetadata: any) => string;
  // biome-ignore lint/suspicious/noExplicitAny: both WASM and portable builds have different concrete types
  HasMetadata: { No: any };
  // biome-ignore lint/suspicious/noExplicitAny: both WASM and portable builds have different concrete types
  InputKind: { Generic: any };
  // biome-ignore lint/suspicious/noExplicitAny: both WASM and portable builds have different concrete types
  prepareProgram: (...args: any[]) => any;
  // biome-ignore lint/suspicious/noExplicitAny: both WASM and portable builds have different concrete types
  runProgram: (...args: any[]) => PvmResult;
}

interface PvmResult {
  status: number;
  exitCode: number;
  pc: number;
  gas: bigint | number;
  result: number[];
  registers: (bigint | number)[];
  memory: Chunk[];
}

type PvmTest = {
  name: string;
  "initial-regs": (bigint | number)[];
  "initial-pc": number;
  "initial-page-map": Page[];
  "initial-memory": Chunk[];
  "initial-gas": bigint | number;
  program: number[];
  "expected-regs": (bigint | number)[];
  "expected-pc": number;
  "expected-gas": bigint | number;
  "expected-status": string;
  "expected-page-fault-address"?: number;
  "expected-memory": Chunk[];
};

const ignored = [
  "inst_load_u8_nok",
  "inst_store_imm_indirect_u16_with_offset_nok",
  "inst_store_imm_indirect_u32_with_offset_nok",
  "inst_store_imm_indirect_u64_with_offset_nok",
  "inst_store_imm_indirect_u8_with_offset_nok",
  "inst_store_imm_u8_trap_inaccessible",
  "inst_store_imm_u8_trap_read_only",
  "inst_store_indirect_u16_with_offset_nok",
  "inst_store_indirect_u32_with_offset_nok",
  "inst_store_indirect_u64_with_offset_nok",
  "inst_store_indirect_u8_with_offset_nok",
  "inst_store_u8_trap_inaccessible",
  "inst_store_u8_trap_read_only",
];

export function runW3fTests(pvm: PvmModule) {
  const options: TestOptions = {
    isDebug: false,
    isSilent: false,
    useSbrkGas: false,
  };

  run<PvmTest>((data, opts, filePath) => processW3f(pvm, data, opts, filePath), options);
}

function processW3f(pvm: PvmModule, data: PvmTest, options: TestOptions, _filePath?: string) {
  if (options.isDebug) {
    console.debug(`🤖 Running ${data.name}`);
  }

  if (ignored.includes(data.name)) {
    if (options.isDebug) {
      console.info(`⏭️ Skipping ${data.name}`);
    }
    return data;
  }
  // input
  const input = {
    registers: read(data, "initial-regs").map((x: number | bigint) => BigInt(x)),
    pc: read(data, "initial-pc"),
    pageMap: asPageMap(read(data, "initial-page-map")),
    memory: asChunks(read(data, "initial-memory")),
    gas: BigInt(read(data, "initial-gas")),
    program: read(data, "program"),
  };

  if (options.isDebug) {
    const assembly = pvm.disassemble(input.program, pvm.InputKind.Generic, pvm.HasMetadata.No);
    console.info("===========");
    console.info(assembly);
    console.info("\n^^^^^^^^^^^\n");
  }

  const exe = pvm.prepareProgram(
    pvm.InputKind.Generic,
    pvm.HasMetadata.No,
    input.program,
    input.registers,
    input.pageMap,
    input.memory,
    [],
    16,
  );
  const result = pvm.runProgram(exe, input.gas, input.pc, options.isDebug, options.useSbrkGas, true);
  const status = statusAsString(result.status);

  // Normalize registers to plain unsigned BigInt array for comparison.
  // The portable build may store signed BigInts or plain numbers in registers.
  result.registers = Array.from(result.registers).map((v: bigint | number) =>
    typeof v === "bigint" ? BigInt.asUintN(64, v) : BigInt(v),
  );
  result.gas = typeof result.gas === "bigint" ? result.gas : BigInt(result.gas);

  // silent mode - just put our vals into expected (comparison done externally)
  if (options.isSilent) {
    data["expected-pc"] = result.pc;
    data["expected-gas"] = result.gas;
    data["expected-status"] = status;
    data["expected-regs"] = result.registers;
    data["expected-page-fault-address"] = result.exitCode;

    return data;
  }

  // compare with expected values
  const expected = {
    // just copy JAM-output result field
    result: result.result,
    status: read(data, "expected-status"),
    registers: read(data, "expected-regs").map((x: number | bigint) => BigInt(x)),
    pc: read(data, "expected-pc"),
    memory: asChunks(read(data, "expected-memory")),
    gas: BigInt(read(data, "expected-gas")),
    exitCode: read(data, "expected-page-fault-address", 0) as number,
  };

  try {
    assert.deepStrictEqual(
      {
        ...result,
        status,
      },
      expected,
    );
    console.log(`${OK} ${data.name}`);
  } catch (e) {
    console.log(`${ERR} ${data.name}`);
    throw e;
  }
  return data;
}

type Chunk = {
  address: number;
  contents?: number[];
  data: number[];
};

function asChunks(chunks: Chunk[]) {
  return chunks.map((chunk: Chunk) => {
    chunk.data = read(chunk, "contents") as number[];
    delete chunk.contents;
    return chunk;
  });
}

type Page = {
  address: number;
  length: number;
  "is-writable": boolean;
  access: Access;
};
enum Access {
  Read = 1,
  Write = 2,
}
function asPageMap(pages: Page[]) {
  return pages.map((page: Page) => {
    page.access = read(page, "is-writable") ? Access.Write : Access.Read;
    return page;
  });
}

function statusAsString(status: number) {
  const map: Record<number, string> = {
    255: "ok",
    0: "halt",
    1: "panic",
    2: "page-fault",
    3: "host",
    4: "oog",
  };

  return map[status] || `unknown(${status})`;
}
