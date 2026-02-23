async function instantiate(module, imports = {}) {
  const adaptedImports = {
    env: Object.setPrototypeOf({
      abort(message, fileName, lineNumber, columnNumber) {
        // ~lib/builtins/abort(~lib/string/String | null?, ~lib/string/String | null?, u32?, u32?) => void
        message = __liftString(message >>> 0);
        fileName = __liftString(fileName >>> 0);
        lineNumber = lineNumber >>> 0;
        columnNumber = columnNumber >>> 0;
        (() => {
          // @external.js
          throw Error(`${message} in ${fileName}:${lineNumber}:${columnNumber}`);
        })();
      },
      "console.log"(text) {
        // ~lib/bindings/dom/console.log(~lib/string/String) => void
        text = __liftString(text >>> 0);
        console.log(text);
      },
    }, Object.assign(Object.create(globalThis), imports.env || {})),
  };
  const { exports } = await WebAssembly.instantiate(module, adaptedImports);
  const memory = exports.memory || imports.env.memory;
  const adaptedExports = Object.setPrototypeOf({
    resetJAM(program, pc, initialGas, args, hasMetadata) {
      // assembly/api-debugger/resetJAM(~lib/array/Array<u8>, u32, i64, ~lib/array/Array<u8>, bool?) => void
      program = __retain(__lowerArray(__setU8, 6, 0, program) || __notnull());
      initialGas = initialGas || 0n;
      args = __lowerArray(__setU8, 6, 0, args) || __notnull();
      hasMetadata = hasMetadata ? 1 : 0;
      try {
        exports.__setArgumentsLength(arguments.length);
        exports.resetJAM(program, pc, initialGas, args, hasMetadata);
      } finally {
        __release(program);
      }
    },
    resetGeneric(program, flatRegisters, initialGas, hasMetadata) {
      // assembly/api-debugger/resetGeneric(~lib/array/Array<u8>, ~lib/array/Array<u8>, i64, bool?) => void
      program = __retain(__lowerArray(__setU8, 6, 0, program) || __notnull());
      flatRegisters = __lowerArray(__setU8, 6, 0, flatRegisters) || __notnull();
      initialGas = initialGas || 0n;
      hasMetadata = hasMetadata ? 1 : 0;
      try {
        exports.__setArgumentsLength(arguments.length);
        exports.resetGeneric(program, flatRegisters, initialGas, hasMetadata);
      } finally {
        __release(program);
      }
    },
    resetGenericWithMemory(program, flatRegisters, pageMap, chunks, initialGas, hasMetadata) {
      // assembly/api-debugger/resetGenericWithMemory(~lib/array/Array<u8>, ~lib/array/Array<u8>, ~lib/typedarray/Uint8Array, ~lib/typedarray/Uint8Array, i64, bool?) => void
      program = __retain(__lowerArray(__setU8, 6, 0, program) || __notnull());
      flatRegisters = __retain(__lowerArray(__setU8, 6, 0, flatRegisters) || __notnull());
      pageMap = __retain(__lowerTypedArray(Uint8Array, 10, 0, pageMap) || __notnull());
      chunks = __lowerTypedArray(Uint8Array, 10, 0, chunks) || __notnull();
      initialGas = initialGas || 0n;
      hasMetadata = hasMetadata ? 1 : 0;
      try {
        exports.__setArgumentsLength(arguments.length);
        exports.resetGenericWithMemory(program, flatRegisters, pageMap, chunks, initialGas, hasMetadata);
      } finally {
        __release(program);
        __release(flatRegisters);
        __release(pageMap);
      }
    },
    nextStep() {
      // assembly/api-debugger/nextStep() => bool
      return exports.nextStep() != 0;
    },
    nSteps(steps) {
      // assembly/api-debugger/nSteps(u32) => bool
      return exports.nSteps(steps) != 0;
    },
    getProgramCounter() {
      // assembly/api-debugger/getProgramCounter() => u32
      return exports.getProgramCounter() >>> 0;
    },
    getExitArg() {
      // assembly/api-debugger/getExitArg() => u32
      return exports.getExitArg() >>> 0;
    },
    setGasLeft(gas) {
      // assembly/api-debugger/setGasLeft(i64) => void
      gas = gas || 0n;
      exports.setGasLeft(gas);
    },
    getRegisters() {
      // assembly/api-debugger/getRegisters() => ~lib/typedarray/Uint8Array
      return __liftTypedArray(Uint8Array, exports.getRegisters() >>> 0);
    },
    setRegisters(flatRegisters) {
      // assembly/api-debugger/setRegisters(~lib/array/Array<u8>) => void
      flatRegisters = __lowerArray(__setU8, 6, 0, flatRegisters) || __notnull();
      exports.setRegisters(flatRegisters);
    },
    getPageDump(index) {
      // assembly/api-debugger/getPageDump(u32) => ~lib/typedarray/Uint8Array
      return __liftTypedArray(Uint8Array, exports.getPageDump(index) >>> 0);
    },
    getPagePointer(page) {
      // assembly/api-debugger/getPagePointer(u32) => usize
      return exports.getPagePointer(page) >>> 0;
    },
    getMemory(address, length) {
      // assembly/api-debugger/getMemory(u32, u32) => ~lib/typedarray/Uint8Array | null
      return __liftTypedArray(Uint8Array, exports.getMemory(address, length) >>> 0);
    },
    setMemory(address, data) {
      // assembly/api-debugger/setMemory(u32, ~lib/typedarray/Uint8Array) => bool
      data = __lowerTypedArray(Uint8Array, 10, 0, data) || __notnull();
      return exports.setMemory(address, data) != 0;
    },
    getAssembly(p) {
      // assembly/api-internal/getAssembly(assembly/program/Program) => ~lib/string/String
      p = __lowerInternref(p) || __notnull();
      return __liftString(exports.getAssembly(p) >>> 0);
    },
    buildMemory(builder, pages, chunks) {
      // assembly/api-internal/buildMemory(assembly/memory/MemoryBuilder, ~lib/array/Array<assembly/api-types/InitialPage>, ~lib/array/Array<assembly/api-types/InitialChunk>) => assembly/memory/Memory
      builder = __retain(__lowerInternref(builder) || __notnull());
      pages = __retain(__lowerArray((pointer, value) => { __setU32(pointer, __lowerRecord44(value) || __notnull()); }, 45, 2, pages) || __notnull());
      chunks = __lowerArray((pointer, value) => { __setU32(pointer, __lowerRecord46(value) || __notnull()); }, 47, 2, chunks) || __notnull();
      try {
        return __liftInternref(exports.buildMemory(builder, pages, chunks) >>> 0);
      } finally {
        __release(builder);
        __release(pages);
      }
    },
    vmInit(input, useSbrkGas) {
      // assembly/api-internal/vmInit(assembly/api-types/VmInput, bool?) => assembly/interpreter/Interpreter
      input = __lowerInternref(input) || __notnull();
      useSbrkGas = useSbrkGas ? 1 : 0;
      exports.__setArgumentsLength(arguments.length);
      return __liftInternref(exports.vmInit(input, useSbrkGas) >>> 0);
    },
    vmRunOnce(input, options) {
      // assembly/api-internal/vmRunOnce(assembly/api-types/VmInput, assembly/api-types/VmRunOptions) => assembly/api-types/VmOutput
      input = __retain(__lowerInternref(input) || __notnull());
      options = __lowerRecord50(options) || __notnull();
      try {
        return __liftRecord51(exports.vmRunOnce(input, options) >>> 0);
      } finally {
        __release(input);
      }
    },
    vmExecute(int, logs) {
      // assembly/api-internal/vmExecute(assembly/interpreter/Interpreter, bool?) => void
      int = __lowerInternref(int) || __notnull();
      logs = logs ? 1 : 0;
      exports.__setArgumentsLength(arguments.length);
      exports.vmExecute(int, logs);
    },
    vmDestroy(int, dumpMemory) {
      // assembly/api-internal/vmDestroy(assembly/interpreter/Interpreter, bool?) => assembly/api-types/VmOutput
      int = __lowerInternref(int) || __notnull();
      dumpMemory = dumpMemory ? 1 : 0;
      exports.__setArgumentsLength(arguments.length);
      return __liftRecord51(exports.vmDestroy(int, dumpMemory) >>> 0);
    },
    InputKind: (values => (
      // assembly/api-utils/InputKind
      values[values.Generic = exports["InputKind.Generic"].valueOf()] = "Generic",
      values[values.SPI = exports["InputKind.SPI"].valueOf()] = "SPI",
      values
    ))({}),
    HasMetadata: (values => (
      // assembly/api-utils/HasMetadata
      values[values.Yes = exports["HasMetadata.Yes"].valueOf()] = "Yes",
      values[values.No = exports["HasMetadata.No"].valueOf()] = "No",
      values
    ))({}),
    getGasCosts(input, kind, withMetadata) {
      // assembly/api-utils/getGasCosts(~lib/array/Array<u8>, i32, i32) => ~lib/array/Array<assembly/gas-costs/BlockGasCost>
      input = __lowerArray(__setU8, 6, 0, input) || __notnull();
      return __liftArray(pointer => __liftRecord56(__getU32(pointer)), 2, exports.getGasCosts(input, kind, withMetadata) >>> 0);
    },
    disassemble(input, kind, withMetadata) {
      // assembly/api-utils/disassemble(~lib/array/Array<u8>, i32, i32) => ~lib/string/String
      input = __lowerArray(__setU8, 6, 0, input) || __notnull();
      return __liftString(exports.disassemble(input, kind, withMetadata) >>> 0);
    },
    prepareProgram(kind, hasMetadata, program, initialRegisters, initialPageMap, initialMemory, args, preallocateMemoryPages) {
      // assembly/api-utils/prepareProgram(i32, i32, ~lib/array/Array<u8>, ~lib/array/Array<u64>, ~lib/array/Array<assembly/api-types/InitialPage>, ~lib/array/Array<assembly/api-types/InitialChunk>, ~lib/array/Array<u8>, u32) => assembly/spi/StandardProgram
      program = __retain(__lowerArray(__setU8, 6, 0, program) || __notnull());
      initialRegisters = __retain(__lowerArray(__setU64, 52, 3, initialRegisters) || __notnull());
      initialPageMap = __retain(__lowerArray((pointer, value) => { __setU32(pointer, __lowerRecord44(value) || __notnull()); }, 45, 2, initialPageMap) || __notnull());
      initialMemory = __retain(__lowerArray((pointer, value) => { __setU32(pointer, __lowerRecord46(value) || __notnull()); }, 47, 2, initialMemory) || __notnull());
      args = __lowerArray(__setU8, 6, 0, args) || __notnull();
      try {
        return __liftInternref(exports.prepareProgram(kind, hasMetadata, program, initialRegisters, initialPageMap, initialMemory, args, preallocateMemoryPages) >>> 0);
      } finally {
        __release(program);
        __release(initialRegisters);
        __release(initialPageMap);
        __release(initialMemory);
      }
    },
    runProgram(program, initialGas, programCounter, logs, useSbrkGas, dumpMemory) {
      // assembly/api-utils/runProgram(assembly/spi/StandardProgram, i64?, u32?, bool?, bool?, bool?) => assembly/api-types/VmOutput
      program = __lowerInternref(program) || __notnull();
      initialGas = initialGas || 0n;
      logs = logs ? 1 : 0;
      useSbrkGas = useSbrkGas ? 1 : 0;
      dumpMemory = dumpMemory ? 1 : 0;
      exports.__setArgumentsLength(arguments.length);
      return __liftRecord51(exports.runProgram(program, initialGas, programCounter, logs, useSbrkGas, dumpMemory) >>> 0);
    },
    pvmStart(program, useSbrkGas) {
      // assembly/api-utils/pvmStart(assembly/spi/StandardProgram, bool?) => u32
      program = __lowerInternref(program) || __notnull();
      useSbrkGas = useSbrkGas ? 1 : 0;
      exports.__setArgumentsLength(arguments.length);
      return exports.pvmStart(program, useSbrkGas) >>> 0;
    },
    pvmDestroy(pvmId) {
      // assembly/api-utils/pvmDestroy(u32) => assembly/api-types/VmOutput | null
      return __liftRecord51(exports.pvmDestroy(pvmId) >>> 0);
    },
    pvmSetRegisters(pvmId, registers) {
      // assembly/api-utils/pvmSetRegisters(u32, ~lib/array/Array<u64>) => void
      registers = __lowerArray(__setU64, 52, 3, registers) || __notnull();
      exports.pvmSetRegisters(pvmId, registers);
    },
    pvmReadMemory(pvmId, address, length) {
      // assembly/api-utils/pvmReadMemory(u32, u32, u32) => ~lib/typedarray/Uint8Array | null
      return __liftTypedArray(Uint8Array, exports.pvmReadMemory(pvmId, address, length) >>> 0);
    },
    pvmGetPagePointer(pvmId, page) {
      // assembly/api-utils/pvmGetPagePointer(u32, u32) => usize
      return exports.pvmGetPagePointer(pvmId, page) >>> 0;
    },
    pvmWriteMemory(pvmId, address, data) {
      // assembly/api-utils/pvmWriteMemory(u32, u32, ~lib/typedarray/Uint8Array) => bool
      data = __lowerTypedArray(Uint8Array, 10, 0, data) || __notnull();
      return exports.pvmWriteMemory(pvmId, address, data) != 0;
    },
    pvmResume(pvmId, gas, pc, logs) {
      // assembly/api-utils/pvmResume(u32, i64, u32, bool?) => assembly/api-types/VmPause | null
      gas = gas || 0n;
      logs = logs ? 1 : 0;
      exports.__setArgumentsLength(arguments.length);
      return __liftRecord60(exports.pvmResume(pvmId, gas, pc, logs) >>> 0);
    },
    wrapAsProgram(bytecode) {
      // assembly/program-build/wrapAsProgram(~lib/typedarray/Uint8Array) => ~lib/typedarray/Uint8Array
      bytecode = __lowerTypedArray(Uint8Array, 10, 0, bytecode) || __notnull();
      return __liftTypedArray(Uint8Array, exports.wrapAsProgram(bytecode) >>> 0);
    },
  }, exports);
  function __lowerRecord44(value) {
    // assembly/api-types/InitialPage
    // Hint: Opt-out from lowering as a record by providing an empty constructor
    if (value == null) return 0;
    const pointer = exports.__pin(exports.__new(12, 44));
    __setU32(pointer + 0, value.address);
    __setU32(pointer + 4, value.length);
    __setU32(pointer + 8, value.access);
    exports.__unpin(pointer);
    return pointer;
  }
  function __lowerRecord46(value) {
    // assembly/api-types/InitialChunk
    // Hint: Opt-out from lowering as a record by providing an empty constructor
    if (value == null) return 0;
    const pointer = exports.__pin(exports.__new(8, 46));
    __setU32(pointer + 0, value.address);
    __setU32(pointer + 4, __lowerArray(__setU8, 6, 0, value.data) || __notnull());
    exports.__unpin(pointer);
    return pointer;
  }
  function __lowerRecord50(value) {
    // assembly/api-types/VmRunOptions
    // Hint: Opt-out from lowering as a record by providing an empty constructor
    if (value == null) return 0;
    const pointer = exports.__pin(exports.__new(3, 50));
    __setU8(pointer + 0, value.useSbrkGas ? 1 : 0);
    __setU8(pointer + 1, value.logs ? 1 : 0);
    __setU8(pointer + 2, value.dumpMemory ? 1 : 0);
    exports.__unpin(pointer);
    return pointer;
  }
  function __liftRecord46(pointer) {
    // assembly/api-types/InitialChunk
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      address: __getU32(pointer + 0),
      data: __liftArray(__getU8, 0, __getU32(pointer + 4)),
    };
  }
  function __liftRecord51(pointer) {
    // assembly/api-types/VmOutput
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      status: __getI32(pointer + 0),
      exitCode: __getU32(pointer + 4),
      pc: __getU32(pointer + 8),
      gas: __getI64(pointer + 16),
      result: __liftArray(__getU8, 0, __getU32(pointer + 24)),
      registers: __liftArray(pointer => BigInt.asUintN(64, __getU64(pointer)), 3, __getU32(pointer + 28)),
      memory: __liftArray(pointer => __liftRecord46(__getU32(pointer)), 2, __getU32(pointer + 32)),
    };
  }
  function __liftRecord56(pointer) {
    // assembly/gas-costs/BlockGasCost
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      pc: __getU32(pointer + 0),
      gas: __getU64(pointer + 8),
    };
  }
  function __liftRecord60(pointer) {
    // assembly/api-types/VmPause
    // Hint: Opt-out from lifting as a record by providing an empty constructor
    if (!pointer) return null;
    return {
      status: __getI32(pointer + 0),
      exitCode: __getU32(pointer + 4),
      pc: __getU32(pointer + 8),
      nextPc: __getU32(pointer + 12),
      gas: __getI64(pointer + 16),
      registers: __liftArray(pointer => BigInt.asUintN(64, __getU64(pointer)), 3, __getU32(pointer + 24)),
    };
  }
  function __liftString(pointer) {
    if (!pointer) return null;
    const
      end = pointer + new Uint32Array(memory.buffer)[pointer - 4 >>> 2] >>> 1,
      memoryU16 = new Uint16Array(memory.buffer);
    let
      start = pointer >>> 1,
      string = "";
    while (end - start > 1024) string += String.fromCharCode(...memoryU16.subarray(start, start += 1024));
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  function __liftArray(liftElement, align, pointer) {
    if (!pointer) return null;
    const
      dataStart = __getU32(pointer + 4),
      length = __dataview.getUint32(pointer + 12, true),
      values = new Array(length);
    for (let i = 0; i < length; ++i) values[i] = liftElement(dataStart + (i << align >>> 0));
    return values;
  }
  function __lowerArray(lowerElement, id, align, values) {
    if (values == null) return 0;
    const
      length = values.length,
      buffer = exports.__pin(exports.__new(length << align, 1)) >>> 0,
      header = exports.__pin(exports.__new(16, id)) >>> 0;
    __setU32(header + 0, buffer);
    __dataview.setUint32(header + 4, buffer, true);
    __dataview.setUint32(header + 8, length << align, true);
    __dataview.setUint32(header + 12, length, true);
    for (let i = 0; i < length; ++i) lowerElement(buffer + (i << align >>> 0), values[i]);
    exports.__unpin(buffer);
    exports.__unpin(header);
    return header;
  }
  function __liftTypedArray(constructor, pointer) {
    if (!pointer) return null;
    return new constructor(
      memory.buffer,
      __getU32(pointer + 4),
      __dataview.getUint32(pointer + 8, true) / constructor.BYTES_PER_ELEMENT
    ).slice();
  }
  function __lowerTypedArray(constructor, id, align, values) {
    if (values == null) return 0;
    const
      length = values.length,
      buffer = exports.__pin(exports.__new(length << align, 1)) >>> 0,
      header = exports.__new(12, id) >>> 0;
    __setU32(header + 0, buffer);
    __dataview.setUint32(header + 4, buffer, true);
    __dataview.setUint32(header + 8, length << align, true);
    new constructor(memory.buffer, buffer, length).set(values);
    exports.__unpin(buffer);
    return header;
  }
  class Internref extends Number {}
  const registry = new FinalizationRegistry(__release);
  function __liftInternref(pointer) {
    if (!pointer) return null;
    const sentinel = new Internref(__retain(pointer));
    registry.register(sentinel, pointer);
    return sentinel;
  }
  function __lowerInternref(value) {
    if (value == null) return 0;
    if (value instanceof Internref) return value.valueOf();
    throw TypeError("internref expected");
  }
  const refcounts = new Map();
  function __retain(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount) refcounts.set(pointer, refcount + 1);
      else refcounts.set(exports.__pin(pointer), 1);
    }
    return pointer;
  }
  function __release(pointer) {
    if (pointer) {
      const refcount = refcounts.get(pointer);
      if (refcount === 1) exports.__unpin(pointer), refcounts.delete(pointer);
      else if (refcount) refcounts.set(pointer, refcount - 1);
      else throw Error(`invalid refcount '${refcount}' for reference '${pointer}'`);
    }
  }
  function __notnull() {
    throw TypeError("value must not be null");
  }
  let __dataview = new DataView(memory.buffer);
  function __setU8(pointer, value) {
    try {
      __dataview.setUint8(pointer, value, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      __dataview.setUint8(pointer, value, true);
    }
  }
  function __setU32(pointer, value) {
    try {
      __dataview.setUint32(pointer, value, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      __dataview.setUint32(pointer, value, true);
    }
  }
  function __setU64(pointer, value) {
    try {
      __dataview.setBigUint64(pointer, value, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      __dataview.setBigUint64(pointer, value, true);
    }
  }
  function __getU8(pointer) {
    try {
      return __dataview.getUint8(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getUint8(pointer, true);
    }
  }
  function __getI32(pointer) {
    try {
      return __dataview.getInt32(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getInt32(pointer, true);
    }
  }
  function __getU32(pointer) {
    try {
      return __dataview.getUint32(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getUint32(pointer, true);
    }
  }
  function __getI64(pointer) {
    try {
      return __dataview.getBigInt64(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getBigInt64(pointer, true);
    }
  }
  function __getU64(pointer) {
    try {
      return __dataview.getBigUint64(pointer, true);
    } catch {
      __dataview = new DataView(memory.buffer);
      return __dataview.getBigUint64(pointer, true);
    }
  }
  return adaptedExports;
}
export const {
  memory,
  resetJAM,
  resetGeneric,
  resetGenericWithMemory,
  nextStep,
  nSteps,
  getProgramCounter,
  setNextProgramCounter,
  getStatus,
  getExitArg,
  getGasLeft,
  setGasLeft,
  getRegisters,
  setRegisters,
  getPageDump,
  getPagePointer,
  getMemory,
  setMemory,
  getAssembly,
  buildMemory,
  vmInit,
  vmRunOnce,
  vmExecute,
  vmDestroy,
  InputKind,
  HasMetadata,
  getGasCosts,
  disassemble,
  prepareProgram,
  runProgram,
  pvmStart,
  pvmDestroy,
  pvmSetRegisters,
  pvmReadMemory,
  pvmGetPagePointer,
  pvmWriteMemory,
  pvmResume,
  wrapAsProgram,
} = await (async url => instantiate(
  await (async () => {
    const isNodeOrBun = typeof process != "undefined" && process.versions != null && (process.versions.node != null || process.versions.bun != null);
    if (isNodeOrBun) { return globalThis.WebAssembly.compile(await (await import("node:fs/promises")).readFile(url)); }
    else { return await globalThis.WebAssembly.compileStreaming(globalThis.fetch(url)); }
  })(), {
  }
))(new URL("release.wasm", import.meta.url));
