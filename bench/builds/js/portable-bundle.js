// dist/build/js/portable/polyfills.js
var g = globalThis;
g.StaticArray = class StaticArray2 extends Array {
  constructor(length) {
    super(length);
    this.fill(0);
  }
};
g.ASC_TARGET = 0;
g.i8 = (value) => {
  const n = typeof value === "bigint" ? Number(value) : value;
  return n << 24 >> 24;
};
g.i16 = (value) => {
  const n = typeof value === "bigint" ? Number(value) : value;
  return n << 16 >> 16;
};
var i32Fn = (value) => {
  if (typeof value === "bigint") {
    return Number(BigInt.asIntN(32, value));
  }
  return value | 0;
};
i32Fn.MIN_VALUE = -2147483648;
i32Fn.MAX_VALUE = 2147483647;
g.i32 = i32Fn;
var i64Fn = (value) => {
  return BigInt.asIntN(64, BigInt(value));
};
i64Fn.MAX_VALUE = 9223372036854775807n;
i64Fn.MIN_VALUE = -9223372036854775808n;
g.i64 = i64Fn;
g.u8 = (v) => {
  if (typeof v === "bigint") {
    return Number(v & 0xffn) >>> 0;
  }
  return (v & 255) >>> 0;
};
g.u16 = (v) => {
  if (typeof v === "bigint") {
    return Number(v & 0xffffn) >>> 0;
  }
  return (v & 65535) >>> 0;
};
g.u32 = (v) => {
  if (typeof v === "bigint") {
    return Number(v & 0xffffffffn) >>> 0;
  }
  return (v & 4294967295) >>> 0;
};
var u64Fn = (value) => {
  return BigInt.asUintN(64, BigInt(value));
};
u64Fn.MAX_VALUE = 18446744073709551615n;
u64Fn.MIN_VALUE = 0n;
g.u64 = u64Fn;
g.f32 = (v) => Math.fround(v);
g.f64 = (v) => +v;
g.bool = (v) => !!v;
var DataViewProto = DataView.prototype;
if (!DataViewProto.setUint64) {
  DataViewProto.setUint64 = function(byteOffset, value, littleEndian) {
    const high = Number(value >> 32n & 0xffffffffn);
    const low = Number(value & 0xffffffffn);
    if (littleEndian) {
      this.setUint32(byteOffset, low, true);
      this.setUint32(byteOffset + 4, high, true);
    } else {
      this.setUint32(byteOffset, high, false);
      this.setUint32(byteOffset + 4, low, false);
    }
  };
}
if (!DataViewProto.getUint64) {
  DataViewProto.getUint64 = function(byteOffset, littleEndian) {
    if (littleEndian) {
      const low2 = BigInt(this.getUint32(byteOffset, true));
      const high2 = BigInt(this.getUint32(byteOffset + 4, true));
      return high2 << 32n | low2;
    }
    const high = BigInt(this.getUint32(byteOffset, false));
    const low = BigInt(this.getUint32(byteOffset + 4, false));
    return high << 32n | low;
  };
}
g.unchecked = (v) => v;
g.inline = () => {
};
g.changetype = (v) => v;

// node_modules/assemblyscript/std/portable/index.js
var globalScope = typeof window !== "undefined" && window || typeof global !== "undefined" && global || self;
if (typeof globalScope.ASC_TARGET === "undefined") {
  let UnreachableError = function() {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UnreachableError);
    } else {
      this.stack = this.name + ": " + this.message + "\n" + new Error().stack;
    }
  }, AssertionError = function(message) {
    this.message = message || "assertion failed";
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionError);
    } else {
      this.stack = this.name + ": " + this.message + "\n" + new Error().stack;
    }
  }, defaultComparator = function(a, b) {
    if (a == b) {
      if (a != 0) return 0;
      a = 1 / a, b = 1 / b;
    } else {
      let nanA = a != a, nanB = b != b;
      if (nanA | nanB) return nanA - nanB;
      if (a == null) a = String(a);
      if (b == null) b = String(b);
    }
    return a > b ? 1 : -1;
  };
  globalScope.ASC_TARGET = 0;
  globalScope.ASC_RUNTIME = 0;
  globalScope.ASC_NO_ASSERT = false;
  globalScope.ASC_MEMORY_BASE = 0;
  globalScope.ASC_OPTIMIZE_LEVEL = 3;
  globalScope.ASC_SHRINK_LEVEL = 0;
  globalScope.ASC_FEATURE_MUTABLE_GLOBAL = false;
  globalScope.ASC_FEATURE_SIGN_EXTENSION = false;
  globalScope.ASC_FEATURE_BULK_MEMORY = false;
  globalScope.ASC_FEATURE_SIMD = false;
  globalScope.ASC_FEATURE_THREADS = false;
  let F64 = new Float64Array(1);
  let U64 = new Uint32Array(F64.buffer);
  Object.defineProperties(
    globalScope["i8"] = function i82(value) {
      return value << 24 >> 24;
    },
    {
      "MIN_VALUE": { value: -128 },
      "MAX_VALUE": { value: 127 },
      parse(str, radix) {
        return parseInt(str, radix) << 24 >> 24;
      }
    }
  );
  Object.defineProperties(
    globalScope["i16"] = function i162(value) {
      return value << 16 >> 16;
    },
    {
      "MIN_VALUE": { value: -32768 },
      "MAX_VALUE": { value: 32767 },
      parse(str, radix) {
        return parseInt(str, radix) << 16 >> 16;
      }
    }
  );
  Object.defineProperties(
    globalScope["i32"] = globalScope["isize"] = function i322(value) {
      return value | 0;
    },
    {
      "MIN_VALUE": { value: -2147483648 },
      "MAX_VALUE": { value: 2147483647 },
      parse(str, radix) {
        return parseInt(str, radix) | 0;
      }
    }
  );
  Object.defineProperties(
    globalScope["u8"] = function u82(value) {
      return value & 255;
    },
    {
      "MIN_VALUE": { value: 0 },
      "MAX_VALUE": { value: 255 },
      parse(str, radix) {
        return parseInt(str, radix) & 255;
      }
    }
  );
  Object.defineProperties(
    globalScope["u16"] = function u162(value) {
      return value & 65535;
    },
    {
      "MIN_VALUE": { value: 0 },
      "MAX_VALUE": { value: 65535 },
      parse(str, radix) {
        return parseInt(str, radix) & 65535;
      }
    }
  );
  Object.defineProperties(
    globalScope["u32"] = globalScope["usize"] = function u322(value) {
      return value >>> 0;
    },
    {
      "MIN_VALUE": { value: 0 },
      "MAX_VALUE": { value: 4294967295 },
      parse(str, radix) {
        return parseInt(str, radix) >>> 0;
      }
    }
  );
  Object.defineProperties(
    globalScope["bool"] = function bool(value) {
      return !!value;
    },
    {
      "MIN_VALUE": { value: false },
      "MAX_VALUE": { value: true },
      parse(str) {
        return str.trim() === "true";
      }
    }
  );
  Object.defineProperties(
    globalScope["f32"] = function f32(value) {
      return Math.fround(value);
    },
    {
      "EPSILON": { value: 11920928955078125e-23 },
      "MIN_VALUE": { value: 1401298464324817e-60 },
      "MAX_VALUE": { value: 34028234663852886e22 },
      "MIN_NORMAL_VALUE": { value: 11754943508222875e-54 },
      "MIN_SAFE_INTEGER": { value: -16777215 },
      "MAX_SAFE_INTEGER": { value: 16777215 },
      "POSITIVE_INFINITY": { value: Infinity },
      "NEGATIVE_INFINITY": { value: -Infinity },
      "NaN": { value: NaN },
      parse(str) {
        return Math.fround(parseFloat(str));
      }
    }
  );
  Object.defineProperties(
    globalScope["f64"] = function f64(value) {
      return +value;
    },
    {
      "EPSILON": { value: 2220446049250313e-31 },
      "MIN_VALUE": { value: 5e-324 },
      "MAX_VALUE": { value: 17976931348623157e292 },
      "MIN_NORMAL_VALUE": { value: 22250738585072014e-324 },
      "MIN_SAFE_INTEGER": { value: -9007199254740991 },
      "MAX_SAFE_INTEGER": { value: 9007199254740991 },
      "POSITIVE_INFINITY": { value: Infinity },
      "NEGATIVE_INFINITY": { value: -Infinity },
      "NaN": { value: NaN },
      parse(str) {
        return parseFloat(str);
      }
    }
  );
  globalScope["clz"] = Math.clz32;
  globalScope["ctz"] = function ctz2(value) {
    return 32 - Math.clz32(~value & value - 1);
  };
  globalScope["popcnt"] = function popcnt2(value) {
    value -= value >>> 1 & 1431655765;
    value = (value & 858993459) + (value >>> 2 & 858993459);
    return (value + (value >>> 4) & 252645135) * 16843009 >>> 24;
  };
  globalScope["rotl"] = function rotl2(value, shift) {
    shift &= 31;
    return value << shift | value >>> 32 - shift;
  };
  globalScope["rotr"] = function rotr2(value, shift) {
    shift &= 31;
    return value >>> shift | value << 32 - shift;
  };
  globalScope["abs"] = Math.abs;
  globalScope["max"] = Math.max;
  globalScope["min"] = Math.min;
  globalScope["ceil"] = Math.ceil;
  globalScope["floor"] = Math.floor;
  globalScope["nearest"] = function nearest(value) {
    const INV_EPS64 = 4503599627370496;
    const y = Math.abs(value);
    return y < INV_EPS64 ? (y + INV_EPS64 - INV_EPS64) * Math.sign(value) : value;
  };
  globalScope["select"] = function select(ifTrue, ifFalse, condition) {
    return condition ? ifTrue : ifFalse;
  };
  globalScope["sqrt"] = Math.sqrt;
  globalScope["trunc"] = Math.trunc;
  globalScope["copysign"] = function copysign(x, y) {
    return y ? Math.abs(x) * Math.sign(y) : (F64[0] = y, U64[1] >>> 31 ? -1 : 1);
  };
  globalScope["bswap"] = function bswap2(value) {
    let a = value >> 8 & 16711935;
    let b = (value & 16711935) << 8;
    value = a | b;
    a = value >> 16 & 65535;
    b = (value & 65535) << 16;
    return a | b;
  };
  UnreachableError.prototype = Object.create(Error.prototype);
  UnreachableError.prototype.name = "UnreachableError";
  UnreachableError.prototype.message = "unreachable";
  globalScope["unreachable"] = function unreachable() {
    throw new UnreachableError();
  };
  AssertionError.prototype = Object.create(Error.prototype);
  AssertionError.prototype.name = "AssertionError";
  globalScope["assert"] = function assert(isTrueish, message) {
    if (isTrueish) return isTrueish;
    throw new AssertionError(message);
  };
  globalScope["changetype"] = function changetype(value) {
    return value;
  };
  String["fromCharCodes"] = function fromCharCodes(arr) {
    const CHUNKSIZE = 1 << 13;
    const len = arr.length;
    if (len <= CHUNKSIZE) {
      return String.fromCharCode.apply(String, arr);
    }
    let index = 0;
    let parts = "";
    while (index < len) {
      parts += String.fromCharCode.apply(
        String,
        arr.slice(index, Math.min(index + CHUNKSIZE, len))
      );
      index += CHUNKSIZE;
    }
    return parts;
  };
  String["fromCodePoints"] = function fromCodePoints(arr) {
    const CHUNKSIZE = 1 << 13;
    const len = arr.length;
    if (len <= CHUNKSIZE) {
      return String.fromCodePoint.apply(String, arr);
    }
    let index = 0;
    let parts = "";
    while (index < len) {
      parts += String.fromCodePoint.apply(
        String,
        arr.slice(index, Math.min(index + CHUNKSIZE, len))
      );
      index += CHUNKSIZE;
    }
    return parts;
  };
  if (!String.prototype.at) {
    Object.defineProperty(String.prototype, "at", {
      value: function at(index) {
        return this.charAt(index >= 0 ? index : index + this.length);
      },
      configurable: true
    });
  }
  if (!String.prototype.replaceAll) {
    Object.defineProperty(String.prototype, "replaceAll", {
      value: function replaceAll(search, replacment) {
        let res = this.split(search).join(replacment);
        if (!search.length) res = replacment + res + replacment;
        return res;
      },
      configurable: true
    });
  }
  const arraySort = Array.prototype.sort;
  Array.prototype.sort = function sort(comparator) {
    return arraySort.call(this, comparator || defaultComparator);
  };
  [
    Array,
    Uint8ClampedArray,
    Uint8Array,
    Int8Array,
    Uint16Array,
    Int16Array,
    Uint32Array,
    Int32Array,
    Float32Array,
    Float64Array
  ].forEach((Ctr) => {
    if (!Ctr.prototype.at) {
      Object.defineProperty(Ctr.prototype, "at", {
        value: function at(index) {
          return this[index >= 0 ? index : index + this.length];
        },
        configurable: true
      });
    }
    if (!Ctr.prototype.findLastIndex) {
      Object.defineProperty(Ctr.prototype, "findLastIndex", {
        value: function findLastIndex(fn) {
          for (let i = this.length - 1; i >= 0; --i) {
            if (fn(this[i], i, this)) return i;
          }
          return -1;
        },
        configurable: true
      });
    }
    if (Ctr != Array) {
      Object.defineProperty(Ctr, "wrap", {
        value: function wrap(buffer, byteOffset, length) {
          return new Ctr(buffer, byteOffset, length);
        },
        configurable: true
      });
    }
  });
  globalScope["isInteger"] = Number.isInteger;
  globalScope["isFloat"] = function isFloat(arg) {
    return typeof arg === "number";
  };
  globalScope["isNullable"] = function isNullable(arg) {
    return true;
  };
  globalScope["isReference"] = function isReference(arg) {
    return typeof arg === "object" || typeof arg === "string";
  };
  globalScope["isFunction"] = function isFunction(arg) {
    return typeof arg === "function";
  };
  globalScope["isString"] = function isString(arg) {
    return typeof arg === "string" || arg instanceof String;
  };
  globalScope["isArray"] = Array.isArray;
  globalScope["isArrayLike"] = function isArrayLike(expr) {
    return expr && typeof expr === "object" && typeof expr.length === "number" && expr.length >= 0 && Math.trunc(expr.length) === expr.length;
  };
  globalScope["isDefined"] = function isDefined(expr) {
    return typeof expr !== "undefined";
  };
  globalScope["isConstant"] = function isConstant(expr) {
    return false;
  };
  globalScope["unchecked"] = function unchecked2(expr) {
    return expr;
  };
  globalScope["fmod"] = function fmod(x, y) {
    return x % y;
  };
  globalScope["fmodf"] = function fmodf(x, y) {
    return Math.fround(x % y);
  };
  globalScope["JSMath"] = Math;
  Object.defineProperties(globalScope["JSMath"], {
    sincos_sin: { value: 0, writable: true },
    sincos_cos: { value: 0, writable: true },
    signbit: {
      value: function signbit(x) {
        F64[0] = x;
        return Boolean(U64[1] >>> 31);
      }
    },
    sincos: {
      value: function sincos(x) {
        this.sincos_sin = Math.sin(x);
        this.sincos_cos = Math.cos(x);
      }
    },
    exp2: {
      value: function exp2(x) {
        return Math.pow(2, x);
      }
    }
  });
  globalScope["unmanaged"] = function() {
  };
  globalScope["trace"] = function(message, n) {
    if (n) message += Array.prototype.slice.call(arguments, 2, 2 + n);
    console.error("trace: " + message);
  };
}

// dist/build/js/assembly/math.js
function minI32(a, b) {
  return a < b ? a : b;
}
function minU32(a, b) {
  return a < b ? a : b;
}

// dist/build/js/assembly/arguments.js
var Arguments;
(function(Arguments2) {
  Arguments2[Arguments2["Zero"] = 0] = "Zero";
  Arguments2[Arguments2["OneImm"] = 1] = "OneImm";
  Arguments2[Arguments2["TwoImm"] = 2] = "TwoImm";
  Arguments2[Arguments2["OneOff"] = 3] = "OneOff";
  Arguments2[Arguments2["OneRegOneImm"] = 4] = "OneRegOneImm";
  Arguments2[Arguments2["OneRegOneExtImm"] = 5] = "OneRegOneExtImm";
  Arguments2[Arguments2["OneRegTwoImm"] = 6] = "OneRegTwoImm";
  Arguments2[Arguments2["OneRegOneImmOneOff"] = 7] = "OneRegOneImmOneOff";
  Arguments2[Arguments2["TwoReg"] = 8] = "TwoReg";
  Arguments2[Arguments2["TwoRegOneImm"] = 9] = "TwoRegOneImm";
  Arguments2[Arguments2["TwoRegOneOff"] = 10] = "TwoRegOneOff";
  Arguments2[Arguments2["TwoRegTwoImm"] = 11] = "TwoRegTwoImm";
  Arguments2[Arguments2["ThreeReg"] = 12] = "ThreeReg";
})(Arguments || (Arguments = {}));
var RELEVANT_ARGS = [0, 1, 2, 1, 2, 3, 3, 3, 2, 3, 3, 4, 3];
var REQUIRED_BYTES = [0, 0, 1, 0, 1, 9, 1, 1, 1, 1, 1, 2, 2];
var Args = class {
  constructor() {
    this.a = 0;
    this.b = 0;
    this.c = 0;
    this.d = 0;
  }
  fill(a, b = 0, c = 0, d = 0) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
    return this;
  }
};
function twoImm(args, code, offset, end) {
  const low = ASC_TARGET === 0 ? lowNibble(code[offset]) : lowNibble(unchecked(code[offset]));
  const split = minI32(4, low) + 1;
  const first = decodeI32(code, offset + 1, offset + split);
  const second = decodeI32(code, offset + split, end);
  return args.fill(first, second, 0, 0);
}
var DECODERS = [
  // DECODERS[Arguments.Zero] =
  (args, _d, _o, _l) => {
    return args.fill(0, 0, 0, 0);
  },
  // DECODERS[Arguments.OneImm] =
  (args, data, o, lim) => {
    return args.fill(decodeI32(data, o, lim), 0, 0, 0);
  },
  // DECODERS[Arguments.TwoImm] =
  (args, data, o, lim) => twoImm(args, data, o, lim),
  // DECODERS[Arguments.OneOff] =
  (args, data, o, lim) => {
    return args.fill(decodeI32(data, o, lim), 0, 0, 0);
  },
  // DECODERS[Arguments.OneRegOneImm] =
  (args, data, o, lim) => {
    return args.fill(lowNibble(data[o]), decodeI32(data, o + 1, lim), 0, 0);
  },
  // DECODERS[Arguments.OneRegOneExtImm] =
  (args, data, o, _lim) => {
    const a = lowNibble(data[o]);
    const b = decodeU32(data, o + 1);
    const c = decodeU32(data, o + 5);
    return args.fill(a, b, c, 0);
  },
  //DECODERS[Arguments.OneRegTwoImm] =
  (args, data, o, lim) => {
    const h = higNibble(data[o]);
    const l = lowNibble(data[o]);
    const split = minI32(4, h) + 1;
    const immA = decodeI32(data, o + 1, o + split);
    const immB = decodeI32(data, o + split, lim);
    return args.fill(l, immA, immB, 0);
  },
  // DECODERS[Arguments.OneRegOneImmOneOff] =
  (args, data, o, lim) => {
    const h = higNibble(data[o]);
    const l = lowNibble(data[o]);
    const split = minI32(4, h) + 1;
    const immA = decodeI32(data, o + 1, o + split);
    const offs = decodeI32(data, o + split, lim);
    return args.fill(l, immA, offs, 0);
  },
  // DECODERS[Arguments.TwoReg] =
  (args, data, o, _lim) => {
    return args.fill(higNibble(data[o]), lowNibble(data[o]), 0, 0);
  },
  // DECODERS[Arguments.TwoRegOneImm] =
  (args, data, o, lim) => {
    const hig = higNibble(data[o]);
    const low = lowNibble(data[o]);
    return args.fill(hig, low, decodeI32(data, o + 1, lim), 0);
  },
  // DECODERS[Arguments.TwoRegOneOff] =
  (args, data, o, lim) => {
    const hig = higNibble(data[o]);
    const low = lowNibble(data[o]);
    return args.fill(hig, low, decodeI32(data, o + 1, lim), 0);
  },
  // DECODERS[Arguments.TwoRegTwoImm] =
  (args, data, o, lim) => {
    const hig = higNibble(data[o]);
    const low = lowNibble(data[o]);
    const result = twoImm(args, data, o + 1, lim);
    return args.fill(hig, low, result.a, result.b);
  },
  // DECODERS[Arguments.ThreeReg] =
  (args, data, o, _lim) => {
    const hig = higNibble(data[o]);
    const low = lowNibble(data[o]);
    const b = lowNibble(data[o + 1]);
    return args.fill(hig, low, b, 0);
  }
];
function lowNibble(byte) {
  return byte & 15;
}
function higNibble(byte) {
  return byte >> 4;
}
function decodeI32(input, start, end) {
  if (end <= start) {
    return 0;
  }
  const l = end - start;
  const len = l < 4 ? l : 4;
  let num = 0;
  for (let i = 0; i < len; i++) {
    num |= u32(input[start + i]) << i * 8;
  }
  const msb = (ASC_TARGET === 0 ? input[start + len - 1] : unchecked(input[start + len - 1])) & 128;
  if (len < 4 && msb > 0) {
    num |= 4294967295 << len * 8;
  }
  return num;
}
function decodeU32(data, offset) {
  let num = u32(data[offset + 0]);
  num |= u32(data[offset + 1]) << 8;
  num |= u32(data[offset + 2]) << 16;
  num |= u32(data[offset + 3]) << 24;
  if (ASC_TARGET === 0)
    return num >>> 0;
  return num;
}

// dist/build/js/assembly/gas.js
function gasCounter(gas) {
  return new GasCounterU64(gas);
}
var GasCounterU64 = class {
  constructor(gas) {
    this.gas = gas;
  }
  set(g2) {
    this.gas = i64(g2);
  }
  get() {
    return this.gas;
  }
  sub(g2) {
    this.gas = this.gas - i64(g2);
    if (this.gas < i64(0)) {
      this.gas = i64(0);
      return true;
    }
    return false;
  }
};

// dist/build/js/assembly/instructions.js
var Instruction = class {
  constructor() {
    this.name = "";
    this.kind = Arguments.Zero;
    this.gas = i64(0);
    this.isTerminating = false;
  }
};
function instruction(name, kind, gas, isTerminating = false) {
  const i = new Instruction();
  i.name = name;
  i.kind = kind;
  i.gas = i64(gas);
  i.isTerminating = isTerminating;
  return i;
}
var MISSING_INSTRUCTION = instruction("INVALID", Arguments.Zero, 1, false);
var SBRK = instruction("SBRK", Arguments.TwoReg, 1);
var INSTRUCTIONS = [
  /* 000 */
  instruction("TRAP", Arguments.Zero, 1, true),
  /* 001 */
  instruction("FALLTHROUGH", Arguments.Zero, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 010 */
  instruction("ECALLI", Arguments.OneImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 020 */
  instruction("LOAD_IMM_64", Arguments.OneRegOneExtImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 030 */
  instruction("STORE_IMM_U8", Arguments.TwoImm, 1),
  /* 031 */
  instruction("STORE_IMM_U16", Arguments.TwoImm, 1),
  /* 032 */
  instruction("STORE_IMM_U32", Arguments.TwoImm, 1),
  /* 033 */
  instruction("STORE_IMM_U64", Arguments.TwoImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 040 */
  instruction("JUMP", Arguments.OneOff, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 050 */
  instruction("JUMP_IND", Arguments.OneRegOneImm, 1, true),
  /* 051 */
  instruction("LOAD_IMM", Arguments.OneRegOneImm, 1),
  /* 052 */
  instruction("LOAD_U8", Arguments.OneRegOneImm, 1),
  /* 053 */
  instruction("LOAD_I8", Arguments.OneRegOneImm, 1),
  /* 054 */
  instruction("LOAD_U16", Arguments.OneRegOneImm, 1),
  /* 055 */
  instruction("LOAD_I16", Arguments.OneRegOneImm, 1),
  /* 056 */
  instruction("LOAD_U32", Arguments.OneRegOneImm, 1),
  /* 057 */
  instruction("LOAD_I32", Arguments.OneRegOneImm, 1),
  /* 058 */
  instruction("LOAD_U64", Arguments.OneRegOneImm, 1),
  /* 059 */
  instruction("STORE_U8", Arguments.OneRegOneImm, 1),
  /* 060 */
  instruction("STORE_U16", Arguments.OneRegOneImm, 1),
  /* 061 */
  instruction("STORE_U32", Arguments.OneRegOneImm, 1),
  /* 062 */
  instruction("STORE_U64", Arguments.OneRegOneImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 070 */
  instruction("STORE_IMM_IND_U8", Arguments.OneRegTwoImm, 1),
  /* 071 */
  instruction("STORE_IMM_IND_U16", Arguments.OneRegTwoImm, 1),
  /* 072 */
  instruction("STORE_IMM_IND_U32", Arguments.OneRegTwoImm, 1),
  /* 073 */
  instruction("STORE_IMM_IND_U64", Arguments.OneRegTwoImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 080 */
  instruction("LOAD_IMM_JUMP", Arguments.OneRegOneImmOneOff, 1, true),
  /* 081 */
  instruction("BRANCH_EQ_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  /* 082 */
  instruction("BRANCH_NE_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  /* 083 */
  instruction("BRANCH_LT_U_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  /* 084 */
  instruction("BRANCH_LE_U_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  /* 085 */
  instruction("BRANCH_GE_U_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  /* 086 */
  instruction("BRANCH_GT_U_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  /* 087 */
  instruction("BRANCH_LT_S_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  /* 088 */
  instruction("BRANCH_LE_S_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  /* 089 */
  instruction("BRANCH_GE_S_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  /* 090 */
  instruction("BRANCH_GT_S_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 100 */
  instruction("MOVE_REG", Arguments.TwoReg, 1),
  /* 101 */
  SBRK,
  /* 102 */
  instruction("COUNT_SET_BITS_64", Arguments.TwoReg, 1),
  /* 103 */
  instruction("COUNT_SET_BITS_32", Arguments.TwoReg, 1),
  /* 104 */
  instruction("LEADING_ZERO_BITS_64", Arguments.TwoReg, 1),
  /* 105 */
  instruction("LEADING_ZERO_BITS_32", Arguments.TwoReg, 1),
  /* 106 */
  instruction("TRAILING_ZERO_BITS_64", Arguments.TwoReg, 1),
  /* 107 */
  instruction("TRAILING_ZERO_BITS_32", Arguments.TwoReg, 1),
  /* 108 */
  instruction("SIGN_EXTEND_8", Arguments.TwoReg, 1),
  /* 109 */
  instruction("SIGN_EXTEND_16", Arguments.TwoReg, 1),
  /* 110 */
  instruction("ZERO_EXTEND_16", Arguments.TwoReg, 1),
  /* 111 */
  instruction("REVERSE_BYTES", Arguments.TwoReg, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 120 */
  instruction("STORE_IND_U8", Arguments.TwoRegOneImm, 1),
  /* 121 */
  instruction("STORE_IND_U16", Arguments.TwoRegOneImm, 1),
  /* 122 */
  instruction("STORE_IND_U32", Arguments.TwoRegOneImm, 1),
  /* 123 */
  instruction("STORE_IND_U64", Arguments.TwoRegOneImm, 1),
  /* 124 */
  instruction("LOAD_IND_U8", Arguments.TwoRegOneImm, 1),
  /* 125 */
  instruction("LOAD_IND_I8", Arguments.TwoRegOneImm, 1),
  /* 126 */
  instruction("LOAD_IND_U16", Arguments.TwoRegOneImm, 1),
  /* 127 */
  instruction("LOAD_IND_I16", Arguments.TwoRegOneImm, 1),
  /* 128 */
  instruction("LOAD_IND_U32", Arguments.TwoRegOneImm, 1),
  /* 129 */
  instruction("LOAD_IND_I32", Arguments.TwoRegOneImm, 1),
  /* 130 */
  instruction("LOAD_IND_U64", Arguments.TwoRegOneImm, 1),
  /* 131 */
  instruction("ADD_IMM_32", Arguments.TwoRegOneImm, 1),
  /* 132 */
  instruction("AND_IMM", Arguments.TwoRegOneImm, 1),
  /* 133 */
  instruction("XOR_IMM", Arguments.TwoRegOneImm, 1),
  /* 134 */
  instruction("OR_IMM", Arguments.TwoRegOneImm, 1),
  /* 135 */
  instruction("MUL_IMM_32", Arguments.TwoRegOneImm, 1),
  /* 136 */
  instruction("SET_LT_U_IMM", Arguments.TwoRegOneImm, 1),
  /* 137 */
  instruction("SET_LT_S_IMM", Arguments.TwoRegOneImm, 1),
  /* 138 */
  instruction("SHLO_L_IMM_32", Arguments.TwoRegOneImm, 1),
  /* 139 */
  instruction("SHLO_R_IMM_32", Arguments.TwoRegOneImm, 1),
  /* 140 */
  instruction("SHAR_R_IMM_32", Arguments.TwoRegOneImm, 1),
  /* 141 */
  instruction("NEG_ADD_IMM_32", Arguments.TwoRegOneImm, 1),
  /* 142 */
  instruction("SET_GT_U_IMM", Arguments.TwoRegOneImm, 1),
  /* 143 */
  instruction("SET_GT_S_IMM", Arguments.TwoRegOneImm, 1),
  /* 144 */
  instruction("SHLO_L_IMM_ALT_32", Arguments.TwoRegOneImm, 1),
  /* 145 */
  instruction("SHLO_R_IMM_ALT_32", Arguments.TwoRegOneImm, 1),
  /* 146 */
  instruction("SHAR_R_IMM_ALT_32", Arguments.TwoRegOneImm, 1),
  /* 147 */
  instruction("CMOV_IZ_IMM", Arguments.TwoRegOneImm, 1),
  /* 148 */
  instruction("CMOV_NZ_IMM", Arguments.TwoRegOneImm, 1),
  /* 149 */
  instruction("ADD_IMM_64", Arguments.TwoRegOneImm, 1),
  /* 150 */
  instruction("MUL_IMM_64", Arguments.TwoRegOneImm, 1),
  /* 151 */
  instruction("SHLO_L_IMM_64", Arguments.TwoRegOneImm, 1),
  /* 152 */
  instruction("SHLO_R_IMM_64", Arguments.TwoRegOneImm, 1),
  /* 153 */
  instruction("SHAR_R_IMM_64", Arguments.TwoRegOneImm, 1),
  /* 154 */
  instruction("NEG_ADD_IMM_64", Arguments.TwoRegOneImm, 1),
  /* 155 */
  instruction("SHLO_L_IMM_ALT_64", Arguments.TwoRegOneImm, 1),
  /* 156 */
  instruction("SHLO_R_IMM_ALT_64", Arguments.TwoRegOneImm, 1),
  /* 157 */
  instruction("SHAR_R_IMM_ALT_64", Arguments.TwoRegOneImm, 1),
  /* 158 */
  instruction("ROT_R_64_IMM", Arguments.TwoRegOneImm, 1),
  /* 159 */
  instruction("ROT_R_64_IMM_ALT", Arguments.TwoRegOneImm, 1),
  /* 160 */
  instruction("ROT_R_32_IMM", Arguments.TwoRegOneImm, 1),
  /* 161 */
  instruction("ROT_R_32_IMM_ALT", Arguments.TwoRegOneImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 170 */
  instruction("BRANCH_EQ", Arguments.TwoRegOneOff, 1, true),
  /* 171 */
  instruction("BRANCH_NE", Arguments.TwoRegOneOff, 1, true),
  /* 172 */
  instruction("BRANCH_LT_U", Arguments.TwoRegOneOff, 1, true),
  /* 173 */
  instruction("BRANCH_LT_S", Arguments.TwoRegOneOff, 1, true),
  /* 174 */
  instruction("BRANCH_GE_U", Arguments.TwoRegOneOff, 1, true),
  /* 175 */
  instruction("BRANCH_GE_S", Arguments.TwoRegOneOff, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 180 */
  instruction("LOAD_IMM_JUMP_IND", Arguments.TwoRegTwoImm, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  /* 190 */
  instruction("ADD_32", Arguments.ThreeReg, 1),
  /* 191 */
  instruction("SUB_32", Arguments.ThreeReg, 1),
  /* 192 */
  instruction("MUL_32", Arguments.ThreeReg, 1),
  /* 193 */
  instruction("DIV_U_32", Arguments.ThreeReg, 1),
  /* 194 */
  instruction("DIV_S_32", Arguments.ThreeReg, 1),
  /* 195 */
  instruction("REM_U_32", Arguments.ThreeReg, 1),
  /* 196 */
  instruction("REM_S_32", Arguments.ThreeReg, 1),
  /* 197 */
  instruction("SHLO_L_32", Arguments.ThreeReg, 1),
  /* 198 */
  instruction("SHLO_R_32", Arguments.ThreeReg, 1),
  /* 199 */
  instruction("SHAR_R_32", Arguments.ThreeReg, 1),
  /* 200 */
  instruction("ADD_64", Arguments.ThreeReg, 1),
  /* 201 */
  instruction("SUB_64", Arguments.ThreeReg, 1),
  /* 202 */
  instruction("MUL_64", Arguments.ThreeReg, 1),
  /* 203 */
  instruction("DIV_U_64", Arguments.ThreeReg, 1),
  /* 204 */
  instruction("DIV_S_64", Arguments.ThreeReg, 1),
  /* 205 */
  instruction("REM_U_64", Arguments.ThreeReg, 1),
  /* 206 */
  instruction("REM_S_64", Arguments.ThreeReg, 1),
  /* 207 */
  instruction("SHLO_L_64", Arguments.ThreeReg, 1),
  /* 208 */
  instruction("SHLO_R_64", Arguments.ThreeReg, 1),
  /* 209 */
  instruction("SHAR_R_64", Arguments.ThreeReg, 1),
  /* 210 */
  instruction("AND", Arguments.ThreeReg, 1),
  /* 211 */
  instruction("XOR", Arguments.ThreeReg, 1),
  /* 212 */
  instruction("OR", Arguments.ThreeReg, 1),
  /* 213 */
  instruction("MUL_UPPER_S_S", Arguments.ThreeReg, 1),
  /* 214 */
  instruction("MUL_UPPER_U_U", Arguments.ThreeReg, 1),
  /* 215 */
  instruction("MUL_UPPER_S_U", Arguments.ThreeReg, 1),
  /* 216 */
  instruction("SET_LT_U", Arguments.ThreeReg, 1),
  /* 217 */
  instruction("SET_LT_S", Arguments.ThreeReg, 1),
  /* 218 */
  instruction("CMOV_IZ", Arguments.ThreeReg, 1),
  /* 219 */
  instruction("CMOV_NZ", Arguments.ThreeReg, 1),
  /* 220 */
  instruction("ROT_L_64", Arguments.ThreeReg, 1),
  /* 221 */
  instruction("ROT_L_32", Arguments.ThreeReg, 1),
  /* 222 */
  instruction("ROT_R_64", Arguments.ThreeReg, 1),
  /* 223 */
  instruction("ROT_R_32", Arguments.ThreeReg, 1),
  /* 224 */
  instruction("AND_INV", Arguments.ThreeReg, 1),
  /* 225 */
  instruction("OR_INV", Arguments.ThreeReg, 1),
  /* 226 */
  instruction("XNOR", Arguments.ThreeReg, 1),
  /* 227 */
  instruction("MAX", Arguments.ThreeReg, 1),
  /* 228 */
  instruction("MAX_U", Arguments.ThreeReg, 1),
  /* 229 */
  instruction("MIN", Arguments.ThreeReg, 1),
  /* 230 */
  instruction("MIN_U", Arguments.ThreeReg, 1)
];

// dist/build/js/assembly/instructions/outcome.js
var Result;
(function(Result2) {
  Result2[Result2["PANIC"] = 0] = "PANIC";
  Result2[Result2["FAULT"] = 1] = "FAULT";
  Result2[Result2["FAULT_ACCESS"] = 2] = "FAULT_ACCESS";
  Result2[Result2["HOST"] = 3] = "HOST";
})(Result || (Result = {}));
var Outcome;
(function(Outcome2) {
  Outcome2[Outcome2["Ok"] = 0] = "Ok";
  Outcome2[Outcome2["StaticJump"] = 1] = "StaticJump";
  Outcome2[Outcome2["DynamicJump"] = 2] = "DynamicJump";
  Outcome2[Outcome2["Result"] = 3] = "Result";
})(Outcome || (Outcome = {}));
var OutcomeData = class {
  constructor() {
    this.outcome = Outcome.Ok;
    this.staticJump = 0;
    this.dJump = 0;
    this.result = Result.PANIC;
    this.exitCode = 0;
  }
};
function status(r, result) {
  r.outcome = Outcome.Result;
  r.result = result;
  return r;
}
function staticJump(r, offset) {
  r.outcome = Outcome.StaticJump;
  r.staticJump = offset;
  return r;
}
function dJump(r, address) {
  r.outcome = Outcome.DynamicJump;
  r.dJump = address;
  return r;
}
function ok(r) {
  r.outcome = Outcome.Ok;
  r.dJump = 0;
  return r;
}
function panic(r) {
  return status(r, Result.PANIC);
}
function hostCall(r, id) {
  r.outcome = Outcome.Result;
  r.result = Result.HOST;
  r.exitCode = id;
  return r;
}
function okOrFault(r, pageFault) {
  if (pageFault.isFault) {
    r.outcome = Outcome.Result;
    r.result = pageFault.isAccess ? Result.FAULT_ACCESS : Result.FAULT;
    r.exitCode = pageFault.fault;
  }
  return r;
}

// dist/build/js/assembly/portable.js
var __decorate = function(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var portable = class _portable {
  // @ts-ignore: parameter type differs between AS and JS
  static asArray(v) {
    if (ASC_TARGET === 0) {
      return Array.from(v);
    }
    return v;
  }
  // --- bswap ---
  // @ts-ignore: @inline is an AS-only decorator
  static bswap_u16(v) {
    if (ASC_TARGET === 0) {
      return u16((v & 255) << 8 | v >> 8 & 255);
    }
    return bswap(v);
  }
  // @ts-ignore: @inline is an AS-only decorator
  static bswap_u32(v) {
    if (ASC_TARGET === 0) {
      return u32((v & 255) << 24 | (v & 65280) << 8 | v >> 8 & 65280 | v >> 24 & 255);
    }
    return bswap(v);
  }
  // @ts-ignore: @inline is an AS-only decorator
  static bswap_u64(v) {
    if (ASC_TARGET === 0) {
      const lo = u32(v);
      const hi = u32(v >> u64(32));
      const sLo = _portable.bswap_u32(lo);
      const sHi = _portable.bswap_u32(hi);
      return u64(u64(sLo) << u64(32) | u64(sHi));
    }
    return bswap(v);
  }
  // --- popcnt ---
  // @ts-ignore: @inline is an AS-only decorator
  static popcnt_u32(v) {
    if (ASC_TARGET === 0) {
      v = v - (v >>> 1 & 1431655765);
      v = (v & 858993459) + (v >>> 2 & 858993459);
      return (v + (v >>> 4) & 252645135) * 16843009 >>> 24;
    }
    return popcnt(v);
  }
  // @ts-ignore: @inline is an AS-only decorator
  static popcnt_u64(v) {
    if (ASC_TARGET === 0) {
      const lo = _portable.popcnt_u32(u32(v));
      const hi = _portable.popcnt_u32(u32(v >> u64(32)));
      return u64(lo + hi);
    }
    return popcnt(v);
  }
  // --- clz ---
  // @ts-ignore: @inline is an AS-only decorator
  static clz_u32(v) {
    if (ASC_TARGET === 0) {
      return Math.clz32(v);
    }
    return clz(v);
  }
  // @ts-ignore: @inline is an AS-only decorator
  static clz_u64(v) {
    if (ASC_TARGET === 0) {
      const hi = u32(v >> u64(32));
      if (hi !== 0) {
        return u64(_portable.clz_u32(hi));
      }
      return u64(32 + _portable.clz_u32(u32(v)));
    }
    return clz(v);
  }
  // --- ctz ---
  // @ts-ignore: @inline is an AS-only decorator
  static ctz_u32(v) {
    if (ASC_TARGET === 0) {
      if (v === 0)
        return 32;
      return 31 - Math.clz32(v & -v);
    }
    return ctz(v);
  }
  // @ts-ignore: @inline is an AS-only decorator
  static ctz_u64(v) {
    if (ASC_TARGET === 0) {
      const lo = u32(v);
      if (lo !== 0) {
        return u64(_portable.ctz_u32(lo));
      }
      return u64(32 + _portable.ctz_u32(u32(v >> u64(32))));
    }
    return ctz(v);
  }
  // --- rotr ---
  // @ts-ignore: @inline is an AS-only decorator
  static rotr_u32(v, shift) {
    if (ASC_TARGET === 0) {
      shift &= 31;
      return u32(v >>> shift | v << 32 - shift);
    }
    return rotr(v, shift);
  }
  // @ts-ignore: @inline is an AS-only decorator
  static rotr_u64(v, shift) {
    if (ASC_TARGET === 0) {
      shift &= u64(63);
      return u64(v >> shift | v << u64(64) - shift);
    }
    return rotr(v, shift);
  }
  // --- rotl ---
  // @ts-ignore: @inline is an AS-only decorator
  static rotl_u32(v, shift) {
    if (ASC_TARGET === 0) {
      shift &= 31;
      return u32(v << shift | v >>> 32 - shift);
    }
    return rotl(v, shift);
  }
  // @ts-ignore: @inline is an AS-only decorator
  static rotl_u64(v, shift) {
    if (ASC_TARGET === 0) {
      shift &= u64(63);
      return u64(v << shift | v >> u64(64) - shift);
    }
    return rotl(v, shift);
  }
  // --- u64 wrapping arithmetic ---
  // @ts-ignore: @inline is an AS-only decorator
  static u64_add(a, b) {
    if (ASC_TARGET === 0) {
      return BigInt.asUintN(64, BigInt(a) + BigInt(b));
    }
    return a + b;
  }
  // @ts-ignore: @inline is an AS-only decorator
  static u64_sub(a, b) {
    if (ASC_TARGET === 0) {
      return BigInt.asUintN(64, BigInt(a) - BigInt(b));
    }
    return a - b;
  }
  // @ts-ignore: @inline is an AS-only decorator
  static u64_mul(a, b) {
    if (ASC_TARGET === 0) {
      return BigInt.asUintN(64, BigInt(a) * BigInt(b));
    }
    return a * b;
  }
};
__decorate([
  inline
], portable, "bswap_u16", null);
__decorate([
  inline
], portable, "bswap_u32", null);
__decorate([
  inline
], portable, "bswap_u64", null);
__decorate([
  inline
], portable, "popcnt_u32", null);
__decorate([
  inline
], portable, "popcnt_u64", null);
__decorate([
  inline
], portable, "clz_u32", null);
__decorate([
  inline
], portable, "clz_u64", null);
__decorate([
  inline
], portable, "ctz_u32", null);
__decorate([
  inline
], portable, "ctz_u64", null);
__decorate([
  inline
], portable, "rotr_u32", null);
__decorate([
  inline
], portable, "rotr_u64", null);
__decorate([
  inline
], portable, "rotl_u32", null);
__decorate([
  inline
], portable, "rotl_u64", null);
__decorate([
  inline
], portable, "u64_add", null);
__decorate([
  inline
], portable, "u64_sub", null);
__decorate([
  inline
], portable, "u64_mul", null);

// dist/build/js/assembly/registers.js
var NO_OF_REGISTERS = 13;
var REG_SIZE_BYTES = 8;
function newRegisters() {
  const regs = new StaticArray(NO_OF_REGISTERS);
  for (let i = 0; i < NO_OF_REGISTERS; i++) {
    regs[i] = u64(0);
  }
  return regs;
}

// dist/build/js/assembly/instructions/utils.js
function mulUpperUnsigned(a, b) {
  const aHigh = a >> u64(32);
  const aLow = a & u64(4294967295);
  const bHigh = b >> u64(32);
  const bLow = b & u64(4294967295);
  const lowLow = portable.u64_mul(aLow, bLow);
  const lowHigh = portable.u64_mul(aLow, bHigh);
  const highLow = portable.u64_mul(aHigh, bLow);
  const highHigh = portable.u64_mul(aHigh, bHigh);
  const carry = portable.u64_add(portable.u64_add(lowLow >> u64(32), lowHigh & u64(4294967295)), highLow & u64(4294967295));
  return portable.u64_add(portable.u64_add(portable.u64_add(highHigh, lowHigh >> u64(32)), highLow >> u64(32)), carry >> u64(32));
}
function mulUpperSigned(a, b) {
  let isResultNegative = false;
  let aAbs = a;
  let bAbs = b;
  if (a < i64(0)) {
    isResultNegative = !isResultNegative;
    aAbs = portable.u64_add(~a, i64(1));
  }
  if (b < i64(0)) {
    isResultNegative = !isResultNegative;
    bAbs = portable.u64_add(~b, i64(1));
  }
  if (isResultNegative) {
    const upper = mulUpperUnsigned(aAbs, bAbs);
    const lower = portable.u64_mul(aAbs, bAbs);
    return portable.u64_add(~upper, lower === u64(0) ? u64(1) : u64(0));
  }
  return mulUpperUnsigned(aAbs, bAbs);
}
function mulUpperSignedUnsigned(a, b) {
  if (a < i64(0)) {
    const aAbs = portable.u64_add(~a, u64(1));
    const upper = mulUpperUnsigned(aAbs, b);
    const lower = portable.u64_mul(aAbs, b);
    return portable.u64_add(~upper, lower === u64(0) ? u64(1) : u64(0));
  }
  return mulUpperUnsigned(a, b);
}
function u8SignExtend(v) {
  return u64(i64(i32(i16(i8(v)))));
}
function u16SignExtend(v) {
  return u64(i64(i32(i16(v))));
}
function u32SignExtend(v) {
  return u64(i64(i32(v)));
}
function reg(v) {
  return v >= u64(NO_OF_REGISTERS) ? NO_OF_REGISTERS - 1 : u32(v);
}

// dist/build/js/assembly/instructions/bit.js
var count_set_bits_64 = (r, args, regs) => {
  regs[reg(args.b)] = portable.popcnt_u64(regs[reg(args.a)]);
  return ok(r);
};
var count_set_bits_32 = (r, args, regs) => {
  regs[reg(args.b)] = u64(portable.popcnt_u32(u32(regs[reg(args.a)])));
  return ok(r);
};
var leading_zero_bits_64 = (r, args, regs) => {
  regs[reg(args.b)] = portable.clz_u64(regs[reg(args.a)]);
  return ok(r);
};
var leading_zero_bits_32 = (r, args, regs) => {
  regs[reg(args.b)] = u64(portable.clz_u32(u32(regs[reg(args.a)])));
  return ok(r);
};
var trailing_zero_bits_64 = (r, args, regs) => {
  regs[reg(args.b)] = portable.ctz_u64(regs[reg(args.a)]);
  return ok(r);
};
var trailing_zero_bits_32 = (r, args, regs) => {
  regs[reg(args.b)] = u64(portable.ctz_u32(u32(regs[reg(args.a)])));
  return ok(r);
};
var sign_extend_8 = (r, args, regs) => {
  regs[reg(args.b)] = u8SignExtend(u8(regs[reg(args.a)]));
  return ok(r);
};
var sign_extend_16 = (r, args, regs) => {
  regs[reg(args.b)] = u16SignExtend(u16(regs[reg(args.a)]));
  return ok(r);
};
var zero_extend_16 = (r, args, regs) => {
  regs[reg(args.b)] = u64(u16(regs[reg(args.a)]));
  return ok(r);
};
var reverse_bytes = (r, args, regs) => {
  regs[reg(args.b)] = portable.bswap_u64(regs[reg(args.a)]);
  return ok(r);
};

// dist/build/js/assembly/instructions/branch.js
var branch_eq_imm = (r, args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] === b) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_ne_imm = (r, args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] !== b) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_lt_u_imm = (r, args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] < b) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_le_u_imm = (r, args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] <= b) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_ge_u_imm = (r, args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] >= b) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_gt_u_imm = (r, args, registers) => {
  const b = u64(u32SignExtend(args.b));
  if (registers[reg(args.a)] > b) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_lt_s_imm = (r, args, registers) => {
  if (i64(registers[reg(args.a)]) < i64(u32SignExtend(args.b))) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_le_s_imm = (r, args, registers) => {
  if (i64(registers[reg(args.a)]) <= i64(u32SignExtend(args.b))) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_ge_s_imm = (r, args, registers) => {
  if (i64(registers[reg(args.a)]) >= i64(u32SignExtend(args.b))) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_gt_s_imm = (r, args, registers) => {
  if (i64(registers[reg(args.a)]) > i64(u32SignExtend(args.b))) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_eq = (r, args, registers) => {
  if (registers[reg(args.a)] === registers[reg(args.b)]) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_ne = (r, args, registers) => {
  if (registers[reg(args.a)] !== registers[reg(args.b)]) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_lt_u = (r, args, registers) => {
  if (registers[reg(args.b)] < registers[reg(args.a)]) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_lt_s = (r, args, registers) => {
  if (i64(registers[reg(args.b)]) < i64(registers[reg(args.a)])) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_ge_u = (r, args, registers) => {
  if (registers[reg(args.b)] >= registers[reg(args.a)]) {
    return staticJump(r, args.c);
  }
  return ok(r);
};
var branch_ge_s = (r, args, registers) => {
  if (i64(registers[reg(args.b)]) >= i64(registers[reg(args.a)])) {
    return staticJump(r, args.c);
  }
  return ok(r);
};

// dist/build/js/assembly/instructions/jump.js
var jump = (r, args) => staticJump(r, args.a);
var jump_ind = (r, args, registers) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.b)));
  return dJump(r, address);
};
var load_imm_jump = (r, args, registers) => {
  registers[reg(args.a)] = u32SignExtend(args.b);
  return staticJump(r, args.c);
};
var load_imm_jump_ind = (r, args, registers) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.d)));
  registers[reg(args.b)] = u32SignExtend(args.c);
  return dJump(r, address);
};

// dist/build/js/assembly/memory-page.js
var PAGE_SIZE = 2 ** 12;
var PAGE_SIZE_SHIFT = 12;
var SEGMENT_SIZE = 2 ** 16;
var SEGMENT_SIZE_SHIFT = 16;
var RESERVED_MEMORY = 2 ** 16;
var RESERVED_PAGES = RESERVED_MEMORY / PAGE_SIZE;
var ALLOCATE_EAGERLY = 2 ** 21;
var Access;
(function(Access2) {
  Access2[Access2["None"] = 0] = "None";
  Access2[Access2["Read"] = 1] = "Read";
  Access2[Access2["Write"] = 2] = "Write";
})(Access || (Access = {}));
var Page = class {
  constructor(access, raw) {
    this.access = access;
    this.raw = raw;
  }
  can(access) {
    return this.access === Access.Write || this.access === access;
  }
};
var RawPage = class {
  constructor(id, page) {
    this.id = id;
    this.page = page;
  }
  get data() {
    if (this.page === null) {
      this.page = new Uint8Array(PAGE_SIZE).fill(0);
    }
    return this.page;
  }
};
var Arena = class {
  constructor(pageCount) {
    this.arenaBytes = PAGE_SIZE * pageCount;
    this.free = [];
    this.extraPageIndex = pageCount;
    const data = new ArrayBuffer(this.arenaBytes);
    for (let i = 0; i < pageCount; i++) {
      if (ASC_TARGET === 0) {
        this.free.unshift(new RawPage(i, new Uint8Array(data, i * PAGE_SIZE, PAGE_SIZE)));
      } else {
        this.free.unshift(new RawPage(i, Uint8Array.wrap(data, i * PAGE_SIZE, PAGE_SIZE)));
      }
    }
  }
  acquire() {
    if (this.free.length > 0) {
      return this.free.pop();
    }
    const allocatedMemory = this.extraPageIndex * PAGE_SIZE;
    if (allocatedMemory === this.arenaBytes) {
      console.log("Warning: Run out of pages! Allocating.");
    }
    const data = allocatedMemory < ALLOCATE_EAGERLY ? new Uint8Array(PAGE_SIZE) : null;
    this.extraPageIndex += 1;
    return new RawPage(this.extraPageIndex, data);
  }
  release(page) {
    this.free.push(page);
  }
};

// dist/build/js/assembly/memory.js
var MaybePageFault = class {
  constructor() {
    this.isFault = false;
    this.isAccess = false;
    this.fault = 0;
  }
};
var EMPTY_UINT8ARRAY = new Uint8Array(0);
var EMPTY_PAGE = new Page(Access.None, new RawPage(-1, null));
var Chunks = class {
  constructor() {
    this.firstPageData = EMPTY_UINT8ARRAY;
    this.firstPageOffset = 0;
    this.secondPageData = EMPTY_UINT8ARRAY;
    this.secondPageEnd = 0;
  }
};
var PageResult = class {
  constructor() {
    this.page = EMPTY_PAGE;
    this.relativeAddress = 0;
  }
};
var MEMORY_SIZE = 4294967296;
var MAX_MEMORY_ADDRESS = 4294967295;
var MemoryBuilder = class {
  constructor(preAllocatePages = 0) {
    this.pages = /* @__PURE__ */ new Map();
    this.arena = new Arena(preAllocatePages);
  }
  /** Allocates memory pages with given `access`, for given `address` and initialize with `zeroes` */
  setEmpty(access, address, len) {
    const endAddress = address + len;
    for (let currentAddress = address; currentAddress < endAddress; currentAddress += PAGE_SIZE) {
      this.getOrCreatePageForAddress(access, currentAddress);
    }
    return this;
  }
  /** Allocates memory pages with given `access`, for given `address` and writes there `data` */
  setData(access, address, data) {
    let currentAddress = address;
    let currentData = data;
    while (currentData.length > 0) {
      const page = this.getOrCreatePageForAddress(access, currentAddress);
      const relAddress = currentAddress % PAGE_SIZE;
      const spaceInPage = PAGE_SIZE - relAddress;
      const end = u32(currentData.length) < spaceInPage ? currentData.length : spaceInPage;
      page.raw.data.set(currentData.subarray(0, end), relAddress);
      currentAddress = currentAddress + end;
      currentData = currentData.subarray(end);
    }
    return this;
  }
  /** Returns memory page for given address (creates if not exists) */
  getOrCreatePageForAddress(access, address) {
    const pageIdx = u32(address >> PAGE_SIZE_SHIFT);
    if (pageIdx < RESERVED_PAGES) {
      throw new Error(`Attempting to allocate reserved page: ${pageIdx}`);
    }
    if (!this.pages.has(pageIdx)) {
      const page = this.arena.acquire();
      this.pages.set(pageIdx, new Page(access, page));
    }
    return this.pages.get(pageIdx);
  }
  build(sbrkAddress = RESERVED_MEMORY, maxHeapPointer = MAX_MEMORY_ADDRESS) {
    return new Memory(this.arena, this.pages, sbrkAddress, maxHeapPointer);
  }
};
var Memory = class {
  constructor(arena, pages = /* @__PURE__ */ new Map(), sbrkAddress = 0, maxHeapPointer = MAX_MEMORY_ADDRESS) {
    this.arena = arena;
    this.pages = pages;
    this.sbrkAddress = sbrkAddress;
    this.pageResult = new PageResult();
    this.chunksResult = new Chunks();
    const sbrkPage = u32(sbrkAddress >> PAGE_SIZE_SHIFT);
    if (sbrkPage < RESERVED_PAGES) {
      throw new Error("sbrk within reserved memory is not allowed!");
    }
    this.lastAllocatedPage = pages.has(sbrkPage) ? sbrkPage : sbrkPage - 1;
    this.maxHeapPointer = u64(maxHeapPointer);
  }
  pageDump(index) {
    if (!this.pages.has(index)) {
      return null;
    }
    return this.pages.get(index).raw.data;
  }
  /**
   * Returns the WASM linear memory pointer (byte offset) for the backing buffer of the page at `pageIndex`.
   *
   * Returns `0` if the page does not exist or is not readable (page/access fault).
   *
   * This enables efficient memory reading on the JS side without extra WASM allocations:
   * ```ts
   * let pagesRead = 0;
   * for (let address = start; address < end; address += PAGE_SIZE) {
   *   const page = address >> PAGE_SIZE_SHIFT;
   *   const ptr = getPagePointer(page);
   *   if (ptr === 0) {
   *     throw new Error(`Page fault at ${page << PAGE_SIZE_SHIFT}`);
   *   }
   *   destination.set(
   *     new Uint8Array(wasm.instance.exports.memory.buffer, ptr, Math.min(end - address, PAGE_SIZE)),
   *     pagesRead << PAGE_SIZE_SHIFT,
   *   );
   *   pagesRead += 1;
   * }
   * ```
   */
  getPagePointer(pageIndex) {
    if (!this.pages.has(pageIndex)) {
      return 0;
    }
    const page = this.pages.get(pageIndex);
    if (!page.can(Access.Read)) {
      return 0;
    }
    return page.raw.data.dataStart;
  }
  free() {
    const pages = portable.asArray(this.pages.values());
    for (let i = 0; i < pages.length; i++) {
      this.arena.release(pages[i].raw);
    }
    this.pages.clear();
  }
  sbrk(faultRes4, amount) {
    const freeMemoryStart = u64(this.sbrkAddress);
    if (amount === 0) {
      faultRes4.isFault = false;
      return freeMemoryStart;
    }
    const newSbrk = portable.u64_add(freeMemoryStart, u64(amount));
    if (newSbrk > this.maxHeapPointer) {
      faultRes4.isFault = true;
      return freeMemoryStart;
    }
    this.sbrkAddress = u32(newSbrk);
    const pageIdx = i32(portable.u64_sub(newSbrk, u64(1)) >> u64(PAGE_SIZE_SHIFT));
    if (pageIdx === this.lastAllocatedPage) {
      return freeMemoryStart;
    }
    for (let i = this.lastAllocatedPage + 1; i <= pageIdx; i++) {
      const page = this.arena.acquire();
      this.pages.set(i, new Page(Access.Write, page));
    }
    this.lastAllocatedPage = pageIdx;
    return freeMemoryStart;
  }
  getU8(faultRes4, address) {
    return u64(u8(this.getBytesReversed(faultRes4, Access.Read, address, 1)));
  }
  getU16(faultRes4, address) {
    return u64(portable.bswap_u16(u16(this.getBytesReversed(faultRes4, Access.Read, address, 2))));
  }
  getU32(faultRes4, address) {
    return u64(portable.bswap_u32(u32(this.getBytesReversed(faultRes4, Access.Read, address, 4))));
  }
  getU64(faultRes4, address) {
    return portable.bswap_u64(this.getBytesReversed(faultRes4, Access.Read, address, 8));
  }
  getI8(faultRes4, address) {
    return u8SignExtend(u8(this.getU8(faultRes4, address)));
  }
  getI16(faultRes4, address) {
    return u16SignExtend(u16(this.getU16(faultRes4, address)));
  }
  getI32(faultRes4, address) {
    return u32SignExtend(u32(this.getU32(faultRes4, address)));
  }
  setU8(faultRes4, address, value) {
    this.setBytes(faultRes4, address, value, 1);
  }
  setU16(faultRes4, address, value) {
    this.setBytes(faultRes4, address, value, 2);
  }
  setU32(faultRes4, address, value) {
    this.setBytes(faultRes4, address, value, 4);
  }
  setU64(faultRes4, address, value) {
    this.setBytes(faultRes4, address, value, 8);
  }
  /**
   * DO NOT USE.
   *
   * @deprecated exposed temporarily for debugger/typeberry API.
   */
  getMemory(fault2, address, length) {
    if (length > 0) {
      let nextAddress = address;
      const pagesToCheck = i32(portable.u64_add(u64(length), u64(PAGE_SIZE - 1)) >> u64(PAGE_SIZE_SHIFT));
      for (let page = 0; page < pagesToCheck; page++) {
        const pageData = this.pageResult;
        this.getPage(fault2, pageData, Access.Read, nextAddress);
        if (fault2.isFault) {
          return null;
        }
        nextAddress += PAGE_SIZE;
      }
    }
    const destination = new Uint8Array(length);
    this.bytesRead(fault2, address, destination, 0);
    if (fault2.isFault) {
      return null;
    }
    return destination;
  }
  bytesRead(faultRes4, address, destination, destinationOffset) {
    let nextAddress = address;
    let destinationIndex = i32(destinationOffset);
    while (destinationIndex < destination.length) {
      const bytesLeft = destination.length - destinationIndex;
      const pageData = this.pageResult;
      this.getPage(faultRes4, pageData, Access.Read, nextAddress);
      if (faultRes4.isFault) {
        return;
      }
      const relAddress = pageData.relativeAddress;
      const bytesToRead = relAddress + bytesLeft < PAGE_SIZE ? bytesLeft : PAGE_SIZE - pageData.relativeAddress;
      const pageEnd = relAddress + bytesToRead;
      const data = pageData.page.raw.data;
      for (let i = relAddress; i < pageEnd; i++) {
        destination[destinationIndex] = data[i];
        destinationIndex++;
      }
      nextAddress += bytesToRead;
    }
    return;
  }
  /** Write bytes from given `source` (with `sourceOffset`) at given `address`. */
  bytesWrite(faultRes4, address, source, sourceOffset) {
    let nextAddress = address;
    let sourceIndex = i32(sourceOffset);
    while (sourceIndex < source.length) {
      const bytesLeft = source.length - sourceIndex;
      const pageData = this.pageResult;
      this.getPage(faultRes4, pageData, Access.Write, nextAddress);
      if (faultRes4.isFault) {
        return;
      }
      const relAddress = pageData.relativeAddress;
      const bytesToWrite = relAddress + bytesLeft < PAGE_SIZE ? bytesLeft : PAGE_SIZE - pageData.relativeAddress;
      const pageEnd = relAddress + bytesToWrite;
      const data = pageData.page.raw.data;
      for (let i = relAddress; i < pageEnd; i++) {
        data[i] = source[sourceIndex];
        sourceIndex++;
      }
      nextAddress += bytesToWrite;
    }
    return;
  }
  getPage(faultRes4, pageData, access, address) {
    const pageIdx = u32(address >> PAGE_SIZE_SHIFT);
    const relAddress = address % PAGE_SIZE;
    const pageStart = pageIdx << PAGE_SIZE_SHIFT;
    if (!this.pages.has(pageIdx)) {
      fault(faultRes4, pageStart);
      pageData.page = EMPTY_PAGE;
      pageData.relativeAddress = relAddress;
      return;
    }
    const page = this.pages.get(pageIdx);
    if (!page.can(access)) {
      fault(faultRes4, pageStart);
      faultRes4.isAccess = true;
      pageData.page = EMPTY_PAGE;
      pageData.relativeAddress = relAddress;
      return;
    }
    faultRes4.isFault = false;
    pageData.page = page;
    pageData.relativeAddress = relAddress;
    return;
  }
  getChunks(faultRes4, chunks, access, address, bytes) {
    if (bytes === 0) {
      faultRes4.isFault = false;
      chunks.firstPageData = EMPTY_UINT8ARRAY;
      chunks.firstPageOffset = 0;
      chunks.secondPageData = EMPTY_UINT8ARRAY;
      chunks.secondPageEnd = 0;
      return;
    }
    const pageData = this.pageResult;
    this.getPage(faultRes4, pageData, access, address);
    if (faultRes4.isFault) {
      return;
    }
    const page = pageData.page;
    const relativeAddress = pageData.relativeAddress;
    const endAddress = relativeAddress + u32(bytes);
    const needSecondPage = endAddress > PAGE_SIZE;
    if (!needSecondPage) {
      chunks.firstPageData = page.raw.data;
      chunks.firstPageOffset = relativeAddress;
      return;
    }
    const secondPageIdx = u32((address + u32(bytes)) % MEMORY_SIZE) >> PAGE_SIZE_SHIFT;
    const secondPageStart = secondPageIdx << PAGE_SIZE_SHIFT;
    if (!this.pages.has(secondPageIdx)) {
      fault(faultRes4, secondPageStart);
      return;
    }
    const secondPage = this.pages.get(secondPageIdx);
    if (!secondPage.can(access)) {
      fault(faultRes4, secondPageStart);
      faultRes4.isAccess = true;
      return;
    }
    chunks.firstPageData = page.raw.data;
    chunks.firstPageOffset = relativeAddress;
    chunks.secondPageData = secondPage.raw.data;
    chunks.secondPageEnd = relativeAddress + u32(bytes) - PAGE_SIZE;
    return;
  }
  /** Write some bytes to at most 2 pages. */
  setBytes(faultRes4, address, value, bytes) {
    const r = this.chunksResult;
    this.getChunks(faultRes4, r, Access.Write, address, bytes);
    if (faultRes4.isFault) {
      return;
    }
    let bytesLeft = u64(value);
    const firstPageEnd = minU32(PAGE_SIZE, r.firstPageOffset + bytes);
    for (let i = r.firstPageOffset; i < firstPageEnd; i++) {
      r.firstPageData[i] = u8(bytesLeft);
      bytesLeft >>= u64(8);
    }
    for (let i = 0; i < r.secondPageEnd; i++) {
      r.secondPageData[i] = u8(bytesLeft);
      bytesLeft >>= u64(8);
    }
  }
  getBytesReversed(faultRes4, access, address, bytes) {
    this.getChunks(faultRes4, this.chunksResult, access, address, bytes);
    if (faultRes4.isFault) {
      return u64(0);
    }
    let r = u64(0);
    const firstPageEnd = minU32(PAGE_SIZE, this.chunksResult.firstPageOffset + bytes);
    for (let i = this.chunksResult.firstPageOffset; i < firstPageEnd; i++) {
      r = r << u64(8) | u64(this.chunksResult.firstPageData[i]);
    }
    for (let i = 0; i < this.chunksResult.secondPageEnd; i++) {
      r = r << u64(8) | u64(this.chunksResult.secondPageData[i]);
    }
    return r;
  }
};
function fault(r, address) {
  r.isFault = true;
  r.isAccess = false;
  r.fault = address;
}

// dist/build/js/assembly/instructions/load.js
var faultRes = new MaybePageFault();
var load_imm_64 = (r, args, registers) => {
  registers[reg(args.a)] = portable.u64_add(u64(args.b), u64(args.c) << u64(32));
  return ok(r);
};
var load_imm = (r, args, registers) => {
  registers[reg(args.a)] = u32SignExtend(args.b);
  return ok(r);
};
var load_u8 = (r, args, registers, memory) => {
  const result = memory.getU8(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_i8 = (r, args, registers, memory) => {
  const result = memory.getI8(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_u16 = (r, args, registers, memory) => {
  const result = memory.getU16(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_i16 = (r, args, registers, memory) => {
  const result = memory.getI16(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_u32 = (r, args, registers, memory) => {
  const result = memory.getU32(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_i32 = (r, args, registers, memory) => {
  const result = memory.getI32(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_u64 = (r, args, registers, memory) => {
  const result = memory.getU64(faultRes, args.b);
  if (!faultRes.isFault) {
    registers[reg(args.a)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_ind_u8 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  const result = memory.getU8(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_ind_i8 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  const result = memory.getI8(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_ind_u16 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  const result = memory.getU16(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_ind_i16 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  const result = memory.getI16(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_ind_u32 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  const result = memory.getU32(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_ind_i32 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  const result = memory.getI32(faultRes, address);
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};
var load_ind_u64 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  const result = memory.getU64(faultRes, u32(address));
  if (!faultRes.isFault) {
    registers[reg(args.b)] = result;
  }
  return okOrFault(r, faultRes);
};

// dist/build/js/assembly/instructions/logic.js
var and_imm = (r, args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] & u32SignExtend(args.c);
  return ok(r);
};
var xor_imm = (r, args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] ^ u32SignExtend(args.c);
  return ok(r);
};
var or_imm = (r, args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)] | u32SignExtend(args.c);
  return ok(r);
};
var and = (r, args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] & registers[reg(args.a)];
  return ok(r);
};
var xor = (r, args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] ^ registers[reg(args.a)];
  return ok(r);
};
var or = (r, args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] | registers[reg(args.a)];
  return ok(r);
};
var and_inv = (r, args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] & ~registers[reg(args.a)];
  return ok(r);
};
var or_inv = (r, args, registers) => {
  registers[reg(args.c)] = u64(registers[reg(args.b)] | ~registers[reg(args.a)]);
  return ok(r);
};
var xnor = (r, args, registers) => {
  registers[reg(args.c)] = u64(~(registers[reg(args.b)] ^ registers[reg(args.a)]));
  return ok(r);
};

// dist/build/js/assembly/instructions/math.js
var add_imm_32 = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const c = u32SignExtend(args.c);
  registers[reg(args.b)] = u32SignExtend(u32(portable.u64_add(a, c)));
  return ok(r);
};
var mul_imm_32 = (r, args, registers) => {
  registers[reg(args.b)] = u32SignExtend(u32(portable.u64_mul(registers[reg(args.a)], u64(args.c))));
  return ok(r);
};
var neg_add_imm_32 = (r, args, registers) => {
  const sum = portable.u64_sub(u64(args.c) | u64(4294967296), registers[reg(args.a)]);
  registers[reg(args.b)] = u32SignExtend(u32(sum));
  return ok(r);
};
var add_imm = (r, args, registers) => {
  const sum = portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c));
  registers[reg(args.b)] = sum;
  return ok(r);
};
var mul_imm = (r, args, registers) => {
  registers[reg(args.b)] = portable.u64_mul(registers[reg(args.a)], u32SignExtend(args.c));
  return ok(r);
};
var neg_add_imm = (r, args, registers) => {
  const sum = portable.u64_sub(u32SignExtend(args.c), registers[reg(args.a)]);
  registers[reg(args.b)] = sum;
  return ok(r);
};
var add_32 = (r, args, registers) => {
  const a = u32(registers[reg(args.a)]);
  const b = u32(registers[reg(args.b)]);
  registers[reg(args.c)] = u32SignExtend(a + b);
  return ok(r);
};
var sub_32 = (r, args, registers) => {
  const a = registers[reg(args.b)];
  const b = u64(4294967296 - u32(registers[reg(args.a)]));
  registers[reg(args.c)] = u32SignExtend(u32(portable.u64_add(a, b)));
  return ok(r);
};
var mul_32 = (r, args, registers) => {
  registers[reg(args.c)] = u32SignExtend(u32(portable.u64_mul(registers[reg(args.a)], registers[reg(args.b)])));
  return ok(r);
};
var div_u_32 = (r, args, registers) => {
  const a = u32(registers[reg(args.a)]);
  if (a === 0) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else {
    const b = u32(registers[reg(args.b)]);
    registers[reg(args.c)] = u32SignExtend(b / a);
  }
  return ok(r);
};
var div_s_32 = (r, args, registers) => {
  const b = i64(u32SignExtend(u32(registers[reg(args.b)])));
  const a = i64(u32SignExtend(u32(registers[reg(args.a)])));
  if (a === i64(0)) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else if (a === i64(-1) && b === i64(i32.MIN_VALUE)) {
    registers[reg(args.c)] = u64(b);
  } else {
    registers[reg(args.c)] = u64(b / a);
  }
  return ok(r);
};
var rem_u_32 = (r, args, registers) => {
  const a = u32(registers[reg(args.a)]);
  const b = u32(registers[reg(args.b)]);
  if (a === 0) {
    registers[reg(args.c)] = u32SignExtend(b);
  } else {
    registers[reg(args.c)] = u32SignExtend(b % a);
  }
  return ok(r);
};
var rem_s_32 = (r, args, registers) => {
  const b = i32(registers[reg(args.b)]);
  const a = i32(registers[reg(args.a)]);
  if (a === 0) {
    registers[reg(args.c)] = u64(i64(b));
  } else if (a === -1 && b === i32.MIN_VALUE) {
    registers[reg(args.c)] = u64(0);
  } else {
    registers[reg(args.c)] = u64(i64(b) % i64(a));
  }
  return ok(r);
};
var add_64 = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = portable.u64_add(a, b);
  return ok(r);
};
var sub = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = portable.u64_sub(b, a);
  return ok(r);
};
var mul = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = portable.u64_mul(a, b);
  return ok(r);
};
var div_u = (r, args, registers) => {
  if (registers[reg(args.a)] === u64(0)) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else {
    registers[reg(args.c)] = registers[reg(args.b)] / registers[reg(args.a)];
  }
  return ok(r);
};
var div_s = (r, args, registers) => {
  const b = i64(registers[reg(args.b)]);
  const a = i64(registers[reg(args.a)]);
  if (a === i64(0)) {
    registers[reg(args.c)] = u64.MAX_VALUE;
  } else if (a === i64(-1) && b === i64.MIN_VALUE) {
    registers[reg(args.c)] = u64(b);
  } else {
    registers[reg(args.c)] = u64(b / a);
  }
  return ok(r);
};
var rem_u = (r, args, registers) => {
  if (registers[reg(args.a)] === u64(0)) {
    registers[reg(args.c)] = registers[reg(args.b)];
  } else {
    registers[reg(args.c)] = registers[reg(args.b)] % registers[reg(args.a)];
  }
  return ok(r);
};
var rem_s = (r, args, registers) => {
  const b = i64(registers[reg(args.b)]);
  const a = i64(registers[reg(args.a)]);
  if (a === i64(0)) {
    registers[reg(args.c)] = u64(b);
  } else if (a === i64(-1) && b === i64.MIN_VALUE) {
    registers[reg(args.c)] = u64(0);
  } else {
    registers[reg(args.c)] = u64(b % a);
  }
  return ok(r);
};
var mul_upper_s_s = (r, args, registers) => {
  registers[reg(args.c)] = mulUpperSigned(i64(registers[reg(args.b)]), i64(registers[reg(args.a)]));
  return ok(r);
};
var mul_upper_u_u = (r, args, registers) => {
  registers[reg(args.c)] = mulUpperUnsigned(registers[reg(args.b)], registers[reg(args.a)]);
  return ok(r);
};
var mul_upper_s_u = (r, args, registers) => {
  registers[reg(args.c)] = mulUpperSignedUnsigned(i64(registers[reg(args.b)]), registers[reg(args.a)]);
  return ok(r);
};
var max = (r, args, registers) => {
  const a = i64(registers[reg(args.a)]);
  const b = i64(registers[reg(args.b)]);
  registers[reg(args.c)] = u64(a < b ? b : a);
  return ok(r);
};
var max_u = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = a < b ? b : a;
  return ok(r);
};
var min = (r, args, registers) => {
  const a = i64(registers[reg(args.a)]);
  const b = i64(registers[reg(args.b)]);
  registers[reg(args.c)] = u64(a > b ? b : a);
  return ok(r);
};
var min_u = (r, args, registers) => {
  const a = registers[reg(args.a)];
  const b = registers[reg(args.b)];
  registers[reg(args.c)] = a > b ? b : a;
  return ok(r);
};

// dist/build/js/assembly/instructions/misc.js
var faultRes2 = new MaybePageFault();
var INVALID = (r) => panic(r);
var trap = (r) => panic(r);
var fallthrough = (r) => ok(r);
var ecalli = (r, args) => hostCall(r, args.a);
var sbrk = (r, args, registers, memory) => {
  const res = memory.sbrk(faultRes2, u32(registers[reg(args.a)]));
  if (faultRes2.isFault) {
    return okOrFault(r, faultRes2);
  }
  registers[reg(args.b)] = res;
  return ok(r);
};

// dist/build/js/assembly/instructions/mov.js
var move_reg = (r, args, registers) => {
  registers[reg(args.b)] = registers[reg(args.a)];
  return ok(r);
};
var cmov_iz_imm = (r, args, registers) => {
  if (registers[reg(args.a)] === u64(0)) {
    registers[reg(args.b)] = u32SignExtend(args.c);
  }
  return ok(r);
};
var cmov_nz_imm = (r, args, registers) => {
  if (registers[reg(args.a)] !== u64(0)) {
    registers[reg(args.b)] = u32SignExtend(args.c);
  }
  return ok(r);
};
var cmov_iz = (r, args, registers) => {
  if (registers[reg(args.a)] === u64(0)) {
    registers[reg(args.c)] = registers[reg(args.b)];
  }
  return ok(r);
};
var cmov_nz = (r, args, registers) => {
  if (registers[reg(args.a)] !== u64(0)) {
    registers[reg(args.c)] = registers[reg(args.b)];
  }
  return ok(r);
};

// dist/build/js/assembly/instructions/rot.js
var rot_r_64_imm = (r, args, regs) => {
  regs[reg(args.b)] = math.rot_r(regs[reg(args.a)], u32SignExtend(args.c));
  return ok(r);
};
var rot_r_64_imm_alt = (r, args, regs) => {
  regs[reg(args.b)] = math.rot_r(u32SignExtend(args.c), regs[reg(args.a)]);
  return ok(r);
};
var rot_r_32_imm = (r, args, regs) => {
  regs[reg(args.b)] = u32SignExtend(math.rot_r_32(u32(regs[reg(args.a)]), u32(args.c)));
  return ok(r);
};
var rot_r_32_imm_alt = (r, args, regs) => {
  regs[reg(args.b)] = u32SignExtend(math.rot_r_32(u32(args.c), u32(regs[reg(args.a)])));
  return ok(r);
};
var rot_l_64 = (r, args, regs) => {
  regs[reg(args.c)] = math.rot_l(regs[reg(args.b)], regs[reg(args.a)]);
  return ok(r);
};
var rot_l_32 = (r, args, regs) => {
  regs[reg(args.c)] = u32SignExtend(math.rot_l_32(u32(regs[reg(args.b)]), u32(regs[reg(args.a)])));
  return ok(r);
};
var rot_r_64 = (r, args, regs) => {
  regs[reg(args.c)] = math.rot_r(regs[reg(args.b)], regs[reg(args.a)]);
  return ok(r);
};
var rot_r_32 = (r, args, regs) => {
  regs[reg(args.c)] = u32SignExtend(math.rot_r_32(u32(regs[reg(args.b)]), u32(regs[reg(args.a)])));
  return ok(r);
};
var math;
(function(math2) {
  function rot_r(v, shift) {
    return portable.rotr_u64(v, shift);
  }
  math2.rot_r = rot_r;
  function rot_r_322(v, shift) {
    return portable.rotr_u32(v, shift);
  }
  math2.rot_r_32 = rot_r_322;
  function rot_l(v, shift) {
    return portable.rotl_u64(v, shift);
  }
  math2.rot_l = rot_l;
  function rot_l_322(v, shift) {
    return portable.rotl_u32(v, shift);
  }
  math2.rot_l_32 = rot_l_322;
})(math || (math = {}));

// dist/build/js/assembly/instructions/set.js
var set_lt_u_imm = (r, args, registers) => {
  const cond = registers[reg(args.a)] < u64(u32SignExtend(args.c));
  registers[reg(args.b)] = cond ? u64(1) : u64(0);
  return ok(r);
};
var set_lt_s_imm = (r, args, registers) => {
  const cond = i64(registers[reg(args.a)]) < i64(u32SignExtend(args.c));
  registers[reg(args.b)] = cond ? u64(1) : u64(0);
  return ok(r);
};
var set_gt_u_imm = (r, args, registers) => {
  const cond = registers[reg(args.a)] > u64(u32SignExtend(args.c));
  registers[reg(args.b)] = cond ? u64(1) : u64(0);
  return ok(r);
};
var set_gt_s_imm = (r, args, registers) => {
  const cond = i64(registers[reg(args.a)]) > i64(u32SignExtend(args.c));
  registers[reg(args.b)] = cond ? u64(1) : u64(0);
  return ok(r);
};
var set_lt_u = (r, args, registers) => {
  registers[reg(args.c)] = registers[reg(args.b)] < registers[reg(args.a)] ? u64(1) : u64(0);
  return ok(r);
};
var set_lt_s = (r, args, registers) => {
  registers[reg(args.c)] = i64(registers[reg(args.b)]) < i64(registers[reg(args.a)]) ? u64(1) : u64(0);
  return ok(r);
};

// dist/build/js/assembly/instructions/shift.js
var MAX_SHIFT_64 = 64;
var MAX_SHIFT_32 = 32;
var shlo_l_imm_32 = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_32);
  const value = u32(registers[reg(args.a)]);
  registers[reg(args.b)] = u32SignExtend(value << shift);
  return ok(r);
};
var shlo_r_imm_32 = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_32);
  const value = u32(registers[reg(args.a)]);
  registers[reg(args.b)] = u32SignExtend(value >>> shift);
  return ok(r);
};
var shar_r_imm_32 = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_32);
  const value = u32SignExtend(u32(registers[reg(args.a)]));
  registers[reg(args.b)] = u64(i64(value) >> i64(shift));
  return ok(r);
};
var shlo_l_imm_alt_32 = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_32));
  registers[reg(args.b)] = u32SignExtend(args.c << shift);
  return ok(r);
};
var shlo_r_imm_alt_32 = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_32));
  registers[reg(args.b)] = u32SignExtend(args.c >>> shift);
  return ok(r);
};
var shar_r_imm_alt_32 = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_32));
  const imm = u32SignExtend(args.c);
  registers[reg(args.b)] = u32SignExtend(u32(i64(imm) >> i64(shift)));
  return ok(r);
};
var shlo_l_imm = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_64);
  registers[reg(args.b)] = u64(registers[reg(args.a)] << u64(shift));
  return ok(r);
};
var shlo_r_imm = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_64);
  registers[reg(args.b)] = registers[reg(args.a)] >> u64(shift);
  return ok(r);
};
var shar_r_imm = (r, args, registers) => {
  const shift = u32(args.c % MAX_SHIFT_64);
  const value = i64(registers[reg(args.a)]);
  registers[reg(args.b)] = u64(value >> i64(shift));
  return ok(r);
};
var shlo_l_imm_alt = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_64));
  registers[reg(args.b)] = u64(u32SignExtend(args.c) << i64(shift));
  return ok(r);
};
var shlo_r_imm_alt = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_64));
  registers[reg(args.b)] = u64(u32SignExtend(args.c)) >> u64(shift);
  return ok(r);
};
var shar_r_imm_alt = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_64));
  const value = u32SignExtend(args.c);
  registers[reg(args.b)] = u32SignExtend(u32(value >> i64(shift)));
  return ok(r);
};
var shlo_l_32 = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_32));
  const value = u32(registers[reg(args.b)]);
  registers[reg(args.c)] = u32SignExtend(value << shift);
  return ok(r);
};
var shlo_r_32 = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_32));
  const value = u32(registers[reg(args.b)]);
  registers[reg(args.c)] = u32SignExtend(value >>> shift);
  return ok(r);
};
var shar_r_32 = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_32));
  const regValue = u32SignExtend(u32(registers[reg(args.b)]));
  registers[reg(args.c)] = u32SignExtend(u32(i64(regValue) >> i64(shift)));
  return ok(r);
};
var shlo_l = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_64));
  registers[reg(args.c)] = u64(registers[reg(args.b)] << u64(shift));
  return ok(r);
};
var shlo_r = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_64));
  registers[reg(args.c)] = registers[reg(args.b)] >> u64(shift);
  return ok(r);
};
var shar_r = (r, args, registers) => {
  const shift = u32(registers[reg(args.a)] % u64(MAX_SHIFT_64));
  registers[reg(args.c)] = u64(i64(registers[reg(args.b)]) >> i64(shift));
  return ok(r);
};

// dist/build/js/assembly/instructions/store.js
var faultRes3 = new MaybePageFault();
var store_imm_u8 = (r, args, _registers, memory) => {
  const address = args.a;
  memory.setU8(faultRes3, address, args.b & 255);
  return okOrFault(r, faultRes3);
};
var store_imm_u16 = (r, args, _registers, memory) => {
  const address = args.a;
  memory.setU16(faultRes3, address, args.b & 65535);
  return okOrFault(r, faultRes3);
};
var store_imm_u32 = (r, args, _registers, memory) => {
  const address = args.a;
  memory.setU32(faultRes3, address, args.b);
  return okOrFault(r, faultRes3);
};
var store_imm_u64 = (r, args, _registers, memory) => {
  const address = args.a;
  memory.setU64(faultRes3, address, u32SignExtend(args.b));
  return okOrFault(r, faultRes3);
};
var store_u8 = (r, args, registers, memory) => {
  memory.setU8(faultRes3, args.b, registers[reg(args.a)] & u64(255));
  return okOrFault(r, faultRes3);
};
var store_u16 = (r, args, registers, memory) => {
  memory.setU16(faultRes3, args.b, registers[reg(args.a)] & u64(65535));
  return okOrFault(r, faultRes3);
};
var store_u32 = (r, args, registers, memory) => {
  memory.setU32(faultRes3, args.b, u32(registers[reg(args.a)]));
  return okOrFault(r, faultRes3);
};
var store_u64 = (r, args, registers, memory) => {
  memory.setU64(faultRes3, args.b, registers[reg(args.a)]);
  return okOrFault(r, faultRes3);
};
var store_imm_ind_u8 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.b)));
  memory.setU8(faultRes3, address, args.c & 255);
  return okOrFault(r, faultRes3);
};
var store_imm_ind_u16 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.b)));
  memory.setU16(faultRes3, address, args.c & 65535);
  return okOrFault(r, faultRes3);
};
var store_imm_ind_u32 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.b)));
  memory.setU32(faultRes3, address, args.c);
  return okOrFault(r, faultRes3);
};
var store_imm_ind_u64 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.b)));
  memory.setU64(faultRes3, address, u32SignExtend(args.c));
  return okOrFault(r, faultRes3);
};
var store_ind_u8 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  memory.setU8(faultRes3, address, registers[reg(args.b)] & u64(255));
  return okOrFault(r, faultRes3);
};
var store_ind_u16 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  memory.setU16(faultRes3, address, registers[reg(args.b)] & u64(65535));
  return okOrFault(r, faultRes3);
};
var store_ind_u32 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  memory.setU32(faultRes3, address, u32(registers[reg(args.b)]));
  return okOrFault(r, faultRes3);
};
var store_ind_u64 = (r, args, registers, memory) => {
  const address = u32(portable.u64_add(registers[reg(args.a)], u32SignExtend(args.c)));
  memory.setU64(faultRes3, address, registers[reg(args.b)]);
  return okOrFault(r, faultRes3);
};

// dist/build/js/assembly/instructions-exe.js
var RUN = [
  /* 000 */
  trap,
  /* 001 */
  fallthrough,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  /* 010 */
  ecalli,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  load_imm_64,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  store_imm_u8,
  store_imm_u16,
  store_imm_u32,
  store_imm_u64,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  jump,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  jump_ind,
  load_imm,
  load_u8,
  load_i8,
  load_u16,
  load_i16,
  load_u32,
  load_i32,
  load_u64,
  store_u8,
  store_u16,
  store_u32,
  store_u64,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  store_imm_ind_u8,
  store_imm_ind_u16,
  store_imm_ind_u32,
  store_imm_ind_u64,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  load_imm_jump,
  branch_eq_imm,
  branch_ne_imm,
  branch_lt_u_imm,
  branch_le_u_imm,
  branch_ge_u_imm,
  branch_gt_u_imm,
  branch_lt_s_imm,
  branch_le_s_imm,
  branch_ge_s_imm,
  branch_gt_s_imm,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  move_reg,
  /* 101 */
  sbrk,
  count_set_bits_64,
  count_set_bits_32,
  leading_zero_bits_64,
  leading_zero_bits_32,
  trailing_zero_bits_64,
  trailing_zero_bits_32,
  sign_extend_8,
  sign_extend_16,
  zero_extend_16,
  reverse_bytes,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  store_ind_u8,
  store_ind_u16,
  store_ind_u32,
  store_ind_u64,
  load_ind_u8,
  load_ind_i8,
  load_ind_u16,
  load_ind_i16,
  load_ind_u32,
  load_ind_i32,
  load_ind_u64,
  add_imm_32,
  and_imm,
  xor_imm,
  or_imm,
  mul_imm_32,
  set_lt_u_imm,
  set_lt_s_imm,
  shlo_l_imm_32,
  shlo_r_imm_32,
  shar_r_imm_32,
  neg_add_imm_32,
  set_gt_u_imm,
  set_gt_s_imm,
  shlo_l_imm_alt_32,
  shlo_r_imm_alt_32,
  shar_r_imm_alt_32,
  cmov_iz_imm,
  cmov_nz_imm,
  add_imm,
  mul_imm,
  shlo_l_imm,
  shlo_r_imm,
  shar_r_imm,
  neg_add_imm,
  shlo_l_imm_alt,
  shlo_r_imm_alt,
  shar_r_imm_alt,
  rot_r_64_imm,
  rot_r_64_imm_alt,
  rot_r_32_imm,
  rot_r_32_imm_alt,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  branch_eq,
  branch_ne,
  branch_lt_u,
  branch_lt_s,
  branch_ge_u,
  branch_ge_s,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  load_imm_jump_ind,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  add_32,
  sub_32,
  mul_32,
  div_u_32,
  div_s_32,
  rem_u_32,
  rem_s_32,
  shlo_l_32,
  shlo_r_32,
  shar_r_32,
  add_64,
  sub,
  mul,
  div_u,
  div_s,
  rem_u,
  rem_s,
  shlo_l,
  shlo_r,
  shar_r,
  and,
  xor,
  or,
  mul_upper_s_s,
  mul_upper_u_u,
  mul_upper_s_u,
  set_lt_u,
  set_lt_s,
  cmov_iz,
  cmov_nz,
  rot_l_64,
  rot_l_32,
  rot_r_64,
  rot_r_32,
  and_inv,
  or_inv,
  xnor,
  max,
  max_u,
  min,
  min_u
];

// dist/build/js/assembly/codec.js
var MASKS = [255, 254, 252, 248, 240, 224, 192, 128];
var variableLength = (firstByte) => {
  const len = MASKS.length;
  for (let i = 0; i < len; i++) {
    if (firstByte >= MASKS[i]) {
      return 8 - i;
    }
  }
  return 0;
};
var Decoder = class {
  constructor(source, offset = 0) {
    this.source = source;
    this.offset = offset;
  }
  isExhausted() {
    return this.offset >= this.source.length;
  }
  ensureBytes(need) {
    if (this.offset + need > this.source.length) {
      throw new Error(`Not enough bytes left. Need: ${need}, left: ${this.source.length - this.offset}`);
    }
  }
  finish() {
    if (!this.isExhausted()) {
      throw new Error(`Expecting to use all bytes from the decoder. Left: ${this.source.length - this.offset}`);
    }
  }
  varU32() {
    this.ensureBytes(1);
    const v = decodeVarU32(this.source.subarray(this.offset));
    this.offset += v.offset;
    return v.value;
  }
  u8() {
    this.ensureBytes(1);
    const v = this.source[this.offset];
    this.offset += 1;
    return v;
  }
  u16() {
    this.ensureBytes(2);
    let v = this.source[this.offset];
    v |= u16(this.source[this.offset + 1]) << 8;
    this.offset += 2;
    return v;
  }
  u24() {
    this.ensureBytes(3);
    let v = this.source[this.offset];
    v |= u32(this.source[this.offset + 1]) << 8;
    v |= u32(this.source[this.offset + 2]) << 16;
    this.offset += 3;
    return v;
  }
  u32() {
    this.ensureBytes(4);
    let v = this.source[this.offset];
    v |= u32(this.source[this.offset + 1]) << 8;
    v |= u32(this.source[this.offset + 2]) << 16;
    v |= u32(this.source[this.offset + 3]) << 24;
    this.offset += 4;
    return v;
  }
  bytes(len) {
    this.ensureBytes(len);
    const v = this.source.subarray(this.offset, this.offset + len);
    this.offset += len;
    return v;
  }
  /** Read remaining bytes into Uint8Array */
  remainingBytes() {
    const v = this.source.subarray(this.offset);
    this.offset += v.length;
    return v;
  }
};
var ValOffset = class {
  constructor(value, offset) {
    this.value = value;
    this.offset = offset;
  }
};
function decodeVarU32(data) {
  const length = i32(variableLength(data[0]));
  const first = u32(data[0]);
  if (length === 0) {
    return new ValOffset(first, 1);
  }
  if (data.length < length) {
    throw new Error(`Not enough bytes to decode 'varU32'. Need ${length}, got: ${data.length}`);
  }
  const msb = first + 2 ** (8 - length) - 2 ** 8 << length * 8;
  let number = 0;
  for (let i = length - 1; i >= 0; i--) {
    number = (number << 8) + data[1 + i];
  }
  number += msb;
  return new ValOffset(number, 1 + length);
}
function encodeVarU32(v) {
  v = u64(v);
  if (v === u64(0)) {
    return new Uint8Array(1);
  }
  let maxEncoded = u64(2 ** (7 * 8));
  if (v >= maxEncoded) {
    const dest = new Uint8Array(9);
    dest[0] = 255;
    const dataView = new DataView(dest.buffer);
    dataView.setUint64(1, v, true);
    return dest;
  }
  let minEncoded = maxEncoded >> u64(7);
  for (let l = 7; l >= 0; l -= 1) {
    if (v >= minEncoded) {
      const dest = new Uint8Array(l + 1);
      const maxVal = u64(2 ** (8 * l));
      const byte = u32(2 ** 8 - 2 ** (8 - l)) + u32(v / maxVal) & 4294967295;
      dest[0] = u8(byte);
      let rest = v % maxVal;
      for (let i = 1; i < 1 + l; i += 1) {
        dest[i] = u8(rest);
        rest >>= u64(8);
      }
      return dest;
    }
    maxEncoded = minEncoded;
    minEncoded >>= u64(7);
  }
  throw new Error(`Unhandled number encoding: ${v}`);
}

// dist/build/js/assembly/program.js
var MAX_SKIP = 24;
var CodeAndMetadata = class {
  constructor(code, metadata) {
    this.code = code;
    this.metadata = metadata;
  }
};
function extractCodeAndMetadata(data) {
  const decoder = new Decoder(data);
  const metadataLength = decoder.varU32();
  const metadata = decoder.bytes(metadataLength);
  const code = decoder.remainingBytes();
  return new CodeAndMetadata(code, metadata);
}
function liftBytes(data) {
  const p = new Uint8Array(data.length);
  p.set(data, 0);
  return p;
}
function lowerBytes(data) {
  const r = new Array(data.length);
  for (let i = 0; i < data.length; i++) {
    r[i] = data[i];
  }
  return r;
}
function deblob(program) {
  const decoder = new Decoder(program);
  const jumpTableLength = decoder.varU32();
  const jumpTableItemLength = decoder.u8();
  const codeLength = decoder.varU32();
  const jumpTableLengthInBytes = i32(jumpTableLength * jumpTableItemLength);
  const rawJumpTable = decoder.bytes(jumpTableLengthInBytes);
  const rawCode = lowerBytes(decoder.bytes(codeLength));
  const rawMask = decoder.bytes(i32((codeLength + 7) / 8));
  const mask = new Mask(rawMask, codeLength);
  const jumpTable = new JumpTable(jumpTableItemLength, rawJumpTable);
  const basicBlocks = new BasicBlocks(rawCode, mask);
  return new Program(rawCode, mask, jumpTable, basicBlocks);
}
var Mask = class {
  constructor(packedMask, codeLength) {
    this.bytesToSkip = new StaticArray(codeLength);
    let lastInstructionOffset = 0;
    for (let i = packedMask.length - 1; i >= 0; i -= 1) {
      let bits = packedMask[i];
      const index = i * 8;
      for (let b = 7; b >= 0; b--) {
        const isSet = bits & 128;
        bits = bits << 1;
        if (index + b < codeLength) {
          lastInstructionOffset = isSet ? 0 : lastInstructionOffset + 1;
          this.bytesToSkip[index + b] = lastInstructionOffset < MAX_SKIP + 1 ? lastInstructionOffset : MAX_SKIP + 1;
        }
      }
    }
  }
  isInstruction(index) {
    if (index >= u32(this.bytesToSkip.length)) {
      return false;
    }
    return ASC_TARGET === 0 ? this.bytesToSkip[u32(index)] === 0 : unchecked(this.bytesToSkip[u32(index)]) === 0;
  }
  /**
   * Given we are at instruction `i`, how many bytes should be skipped to
   * reach the next instruction (i.e. `skip(i) + 1` from the GP).
   *
   * NOTE: we don't guarantee that `isInstruction()` will return true
   * for the new program counter, since `skip` function is bounded by
   * an upper limit of `24` bytes.
   */
  skipBytesToNextInstruction(i) {
    if (i + 1 < this.bytesToSkip.length) {
      return ASC_TARGET === 0 ? this.bytesToSkip[i + 1] : unchecked(this.bytesToSkip[i + 1]);
    }
    return 0;
  }
  toString() {
    let v = "Mask[";
    for (let i = 0; i < this.bytesToSkip.length; i += 1) {
      v += `${this.bytesToSkip[i]}, `;
    }
    return `${v}]`;
  }
};
var BasicBlock;
(function(BasicBlock2) {
  BasicBlock2[BasicBlock2["NONE"] = 0] = "NONE";
  BasicBlock2[BasicBlock2["START"] = 2] = "START";
  BasicBlock2[BasicBlock2["END"] = 4] = "END";
})(BasicBlock || (BasicBlock = {}));
var BasicBlocks = class {
  constructor(code, mask) {
    const len = code.length;
    const isStartOrEnd = new StaticArray(len);
    if (len > 0) {
      isStartOrEnd[0] = BasicBlock.START;
    }
    for (let n = 0; n < len; n += 1) {
      const isInstructionInMask = mask.isInstruction(n);
      if (!isInstructionInMask) {
        continue;
      }
      const skipArgs = mask.skipBytesToNextInstruction(n);
      const iData = code[n] >= INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[code[n]];
      const isTerminating = iData.isTerminating;
      if (isTerminating) {
        const newBlockStart = n + 1 + skipArgs;
        if (newBlockStart < len) {
          isStartOrEnd[newBlockStart] = BasicBlock.START;
        }
        isStartOrEnd[n] |= BasicBlock.END;
      }
    }
    this.isStartOrEnd = isStartOrEnd;
  }
  isStart(newPc) {
    if (newPc < this.isStartOrEnd.length) {
      return ASC_TARGET === 0 ? (this.isStartOrEnd[newPc] & BasicBlock.START) > 0 : (unchecked(this.isStartOrEnd[newPc]) & BasicBlock.START) > 0;
    }
    return false;
  }
  toString() {
    let v = "BasicBlocks[";
    for (let i = 0; i < this.isStartOrEnd.length; i += 1) {
      let t = "";
      const isStart = (this.isStartOrEnd[i] & BasicBlock.START) > 0;
      t += isStart ? "start" : "";
      const isEnd = (this.isStartOrEnd[i] & BasicBlock.END) > 0;
      t += isEnd ? "end" : "";
      if (t.length > 0) {
        v += `${i} -> ${t}, `;
      }
    }
    return `${v}]`;
  }
};
var JumpTable = class {
  constructor(itemBytes, data) {
    const jumps = new StaticArray(itemBytes > 0 ? i32(data.length / itemBytes) : 0);
    for (let i = 0; i < data.length; i += itemBytes) {
      let num = u64(0);
      for (let j = itemBytes - 1; j >= 0; j--) {
        let nextNum = num << u64(8);
        let isOverflow = nextNum < num;
        nextNum = portable.u64_add(nextNum, u64(data[i + j]));
        isOverflow = isOverflow || nextNum < num;
        num = isOverflow ? u64.MAX_VALUE : nextNum;
      }
      jumps[i32(i / itemBytes)] = num;
    }
    this.jumps = jumps;
  }
  toString() {
    let v = "JumpTable[";
    for (let i = 0; i < this.jumps.length; i += 1) {
      v += `${i} -> ${this.jumps[i]}, `;
    }
    return `${v}]`;
  }
};
var Program = class {
  constructor(code, mask, jumpTable, basicBlocks) {
    this.code = code;
    this.mask = mask;
    this.jumpTable = jumpTable;
    this.basicBlocks = basicBlocks;
  }
  toString() {
    return `Program { code: ${this.code}, mask: ${this.mask}, jumpTable: ${this.jumpTable}, basicBlocks: ${this.basicBlocks} }`;
  }
};
function decodeArguments(args, kind, code, offset, lim) {
  if (code.length < offset + REQUIRED_BYTES[kind]) {
    const extended = new Array(REQUIRED_BYTES[kind]);
    for (let i = offset; i < code.length; i++) {
      extended[i - offset] = code[i];
    }
    return DECODERS[kind](args, extended, 0, lim);
  }
  return DECODERS[kind](args, code, offset, offset + lim);
}
var ResolvedArguments = class {
  constructor() {
    this.a = i64(0);
    this.b = i64(0);
    this.c = i64(0);
    this.d = i64(0);
    this.decoded = new Args();
  }
};
function resolveArguments(argsRes, kind, code, offset, lim, registers) {
  const args = decodeArguments(argsRes, kind, code, offset, lim);
  if (args === null) {
    return null;
  }
  const resolved = new ResolvedArguments();
  resolved.decoded = args;
  switch (kind) {
    case Arguments.Zero:
      return resolved;
    case Arguments.OneImm:
      resolved.a = u32SignExtend(args.a);
      return resolved;
    case Arguments.TwoImm:
      resolved.a = u32SignExtend(args.a);
      resolved.b = u32SignExtend(args.b);
      return resolved;
    case Arguments.OneOff:
      resolved.a = u32SignExtend(args.a);
      return resolved;
    case Arguments.OneRegOneImm:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = u32SignExtend(args.b);
      return resolved;
    case Arguments.OneRegOneExtImm:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = portable.u64_add(u64(args.a) << u64(32), u64(args.b));
      return resolved;
    case Arguments.OneRegTwoImm:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = u32SignExtend(args.b);
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.OneRegOneImmOneOff:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = u32SignExtend(args.b);
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.TwoReg:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      return resolved;
    case Arguments.TwoRegOneImm:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.TwoRegOneOff:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      resolved.c = u32SignExtend(args.c);
      return resolved;
    case Arguments.TwoRegTwoImm:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      resolved.c = u32SignExtend(args.c);
      resolved.d = u32SignExtend(args.d);
      return resolved;
    case Arguments.ThreeReg:
      resolved.a = registers[reg(u64(args.a))];
      resolved.b = registers[reg(u64(args.b))];
      resolved.c = registers[reg(u64(args.c))];
      return resolved;
    default:
      throw new Error(`Unhandled arguments kind: ${kind}`);
  }
}

// dist/build/js/assembly/interpreter.js
var Status;
(function(Status2) {
  Status2[Status2["OK"] = -1] = "OK";
  Status2[Status2["HALT"] = 0] = "HALT";
  Status2[Status2["PANIC"] = 1] = "PANIC";
  Status2[Status2["FAULT"] = 2] = "FAULT";
  Status2[Status2["HOST"] = 3] = "HOST";
  Status2[Status2["OOG"] = 4] = "OOG";
})(Status || (Status = {}));
var DjumpStatus;
(function(DjumpStatus2) {
  DjumpStatus2[DjumpStatus2["OK"] = 0] = "OK";
  DjumpStatus2[DjumpStatus2["HALT"] = 1] = "HALT";
  DjumpStatus2[DjumpStatus2["PANIC"] = 2] = "PANIC";
})(DjumpStatus || (DjumpStatus = {}));
var DjumpResult = class {
  constructor() {
    this.status = DjumpStatus.OK;
    this.newPc = 0;
  }
};
var BranchResult = class {
  constructor() {
    this.isOkay = false;
    this.newPc = 0;
  }
};
var Interpreter = class {
  constructor(program, registers, memory = new MemoryBuilder().build(0)) {
    this.djumpRes = new DjumpResult();
    this.argsRes = new Args();
    this.outcomeRes = new OutcomeData();
    this.branchRes = new BranchResult();
    this.program = program;
    this.registers = registers;
    this.memory = memory;
    this.gas = gasCounter(i64(0));
    this.pc = 0;
    this.status = Status.OK;
    this.exitCode = 0;
    this.nextPc = 0;
    this.useSbrkGas = false;
  }
  nextSteps(nSteps2 = 1) {
    if (this.status === Status.HOST) {
      this.status = Status.OK;
      this.pc = this.nextPc;
      this.nextPc = -1;
    }
    if (this.status !== Status.OK) {
      return false;
    }
    if (this.nextPc !== -1) {
      this.pc = this.nextPc;
      this.nextPc = -1;
      return true;
    }
    const program = this.program;
    const code = program.code;
    const mask = program.mask;
    const argsRes = this.argsRes;
    const outcomeRes = this.outcomeRes;
    for (let i = 0; i < nSteps2; i++) {
      this.exitCode = 0;
      outcomeRes.result = Result.PANIC;
      outcomeRes.outcome = Outcome.Ok;
      const pc = this.pc;
      if (!mask.isInstruction(pc)) {
        if (this.gas.sub(MISSING_INSTRUCTION.gas)) {
          this.status = Status.OOG;
        } else {
          this.status = Status.PANIC;
        }
        return false;
      }
      const instruction2 = code[pc];
      const iData = instruction2 < INSTRUCTIONS.length ? INSTRUCTIONS[instruction2] : MISSING_INSTRUCTION;
      if (this.gas.sub(iData.gas)) {
        this.status = Status.OOG;
        return false;
      }
      if (iData === MISSING_INSTRUCTION) {
        this.status = Status.PANIC;
        return false;
      }
      const skipBytes2 = mask.skipBytesToNextInstruction(pc);
      const args = decodeArguments(argsRes, iData.kind, code, pc + 1, skipBytes2);
      if (iData === SBRK && this.useSbrkGas) {
        const alloc = u64(u32(this.registers[reg(u64(args.a))]));
        const gas = portable.u64_mul(portable.u64_sub(portable.u64_add(alloc, u64(PAGE_SIZE)), u64(1)) >> u64(PAGE_SIZE_SHIFT), u64(16));
        if (this.gas.sub(gas)) {
          this.status = Status.OOG;
          return false;
        }
      }
      const exe = RUN[instruction2];
      const outcome = exe(outcomeRes, args, this.registers, this.memory);
      switch (outcome.outcome) {
        case Outcome.DynamicJump: {
          const res = dJump2(this.djumpRes, program.jumpTable, outcome.dJump);
          if (res.status === DjumpStatus.HALT) {
            this.status = Status.HALT;
            return false;
          }
          if (res.status === DjumpStatus.PANIC) {
            this.status = Status.PANIC;
            return false;
          }
          const branchResult = branch(this.branchRes, program.basicBlocks, res.newPc, 0);
          if (!branchResult.isOkay) {
            this.status = Status.PANIC;
            return false;
          }
          this.pc = branchResult.newPc;
          continue;
        }
        case Outcome.StaticJump: {
          const branchResult = branch(this.branchRes, program.basicBlocks, pc, outcome.staticJump);
          if (!branchResult.isOkay) {
            this.status = Status.PANIC;
            return false;
          }
          this.pc = branchResult.newPc;
          continue;
        }
        case Outcome.Result: {
          if (outcome.result === Result.HOST) {
            this.status = Status.HOST;
            this.exitCode = outcome.exitCode;
            this.nextPc = this.pc + 1 + skipBytes2;
            return false;
          }
          if (outcome.result === Result.FAULT) {
            if (outcome.exitCode < RESERVED_MEMORY) {
              this.status = Status.PANIC;
            } else {
              this.status = Status.FAULT;
              this.exitCode = outcome.exitCode;
            }
            return false;
          }
          if (outcome.result === Result.FAULT_ACCESS) {
            this.status = Status.PANIC;
            return false;
          }
          if (outcome.result === Result.PANIC) {
            this.status = Status.PANIC;
            this.exitCode = outcome.exitCode;
            return false;
          }
          throw new Error("Unknown result");
        }
        case Outcome.Ok: {
          this.pc += 1 + skipBytes2;
          continue;
        }
      }
    }
    return true;
  }
};
function branch(r, basicBlocks, pc, offset) {
  const newPc = pc + offset;
  if (basicBlocks.isStart(newPc)) {
    r.isOkay = true;
    r.newPc = newPc;
  } else {
    r.isOkay = false;
    r.newPc = 0;
  }
  return r;
}
var EXIT = 4294901760;
var JUMP_ALIGMENT_FACTOR = 2;
function dJump2(r, jumpTable, address) {
  if (address === EXIT) {
    r.status = DjumpStatus.HALT;
    return r;
  }
  if (address === 0 || address % JUMP_ALIGMENT_FACTOR !== 0) {
    r.status = DjumpStatus.PANIC;
    return r;
  }
  const index = u32(address / JUMP_ALIGMENT_FACTOR) - 1;
  if (index >= jumpTable.jumps.length) {
    r.status = DjumpStatus.PANIC;
    return r;
  }
  const newPc = ASC_TARGET === 0 ? jumpTable.jumps[index] : unchecked(jumpTable.jumps[index]);
  if (newPc >= MAX_U32) {
    r.status = DjumpStatus.PANIC;
    return r;
  }
  r.status = DjumpStatus.OK;
  r.newPc = u32(newPc);
  return r;
}
var MAX_U32 = u64(4294967296);

// dist/build/js/assembly/api-types.js
var InitialPage = class {
  constructor() {
    this.address = 0;
    this.length = 0;
    this.access = Access.None;
  }
};
var InitialChunk = class {
  constructor() {
    this.address = 0;
    this.data = [];
  }
};
var VmRunOptions = class {
  constructor() {
    this.useSbrkGas = false;
    this.logs = false;
    this.dumpMemory = false;
  }
};
var VmInput = class {
  constructor(program, memory, registers) {
    this.program = program;
    this.memory = memory;
    this.registers = registers;
    this.pc = 0;
    this.gas = i64(0);
  }
};
var VmPause = class {
  constructor() {
    this.status = Status.OK;
    this.exitCode = 0;
    this.pc = 0;
    this.nextPc = 0;
    this.gas = i64(0);
    this.registers = [];
  }
};
var VmOutput = class {
  constructor() {
    this.status = Status.OK;
    this.exitCode = 0;
    this.pc = 0;
    this.gas = i64(0);
    this.result = [];
    this.registers = [];
    this.memory = [];
  }
};

// dist/build/js/assembly/api-internal.js
function getAssembly(p) {
  const len = p.code.length;
  if (len === 0) {
    return "<seems that there is no code>";
  }
  let v = "";
  const argsRes = new Args();
  for (let i = 0; i < len; i++) {
    if (!p.mask.isInstruction(i)) {
      throw new Error("We should iterate only over instructions!");
    }
    const instruction2 = p.code[i];
    const iData = instruction2 >= INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[instruction2];
    v += "\n";
    v += `${i}: `;
    v += iData.name;
    v += `(${instruction2})`;
    const skipBytes2 = p.mask.skipBytesToNextInstruction(i);
    const args = decodeArguments(argsRes, iData.kind, p.code, i + 1, skipBytes2);
    const argsArray = [args.a, args.b, args.c, args.d];
    const relevantArgs = RELEVANT_ARGS[iData.kind];
    for (let i2 = 0; i2 < relevantArgs; i2++) {
      v += ` ${argsArray[i2]}, `;
    }
    i += skipBytes2;
  }
  return v;
}
function buildMemory(builder, pages, chunks) {
  let sbrkIndex = RESERVED_MEMORY;
  for (let i = 0; i < pages.length; i++) {
    const initPage = pages[i];
    builder.setData(initPage.access, initPage.address, new Uint8Array(initPage.length));
    if (initPage.access === Access.Write) {
      const pageEnd = initPage.address + initPage.length;
      sbrkIndex = pageEnd < sbrkIndex ? sbrkIndex : pageEnd;
    }
  }
  for (let i = 0; i < chunks.length; i++) {
    const initChunk = chunks[i];
    const data = new Uint8Array(initChunk.data.length);
    for (let j = 0; j < data.length; j++) {
      data[j] = initChunk.data[j];
    }
    builder.setData(Access.None, initChunk.address, data);
    const chunkEnd = initChunk.address + initChunk.data.length;
    sbrkIndex = chunkEnd < sbrkIndex ? sbrkIndex : chunkEnd;
  }
  return builder.build(sbrkIndex);
}
function vmInit(input, useSbrkGas = false) {
  const int = new Interpreter(input.program, input.registers, input.memory);
  int.useSbrkGas = useSbrkGas;
  int.nextPc = input.pc;
  int.gas.set(input.gas);
  return int;
}
function vmRunOnce(input, options) {
  const int = vmInit(input, options.useSbrkGas);
  vmExecute(int, options.logs);
  return vmDestroy(int, options.dumpMemory);
}
function vmExecute(int, logs = false) {
  let isOk = true;
  const argsRes = new Args();
  for (; ; ) {
    if (!isOk) {
      if (logs)
        console.log(`REGISTERS (final) = [${int.registers.map((x) => `${x} (0x${x.toString(16)})`).join(", ")}]`);
      if (logs)
        console.log(`Finished with status: ${int.status}`);
      if (logs)
        console.log(`Exit code: ${int.exitCode}`);
      break;
    }
    if (logs)
      console.log(`PC = ${int.pc}`);
    if (logs)
      console.log(`GAS = ${int.gas.get()}`);
    if (logs)
      console.log(`STATUS = ${int.status}`);
    if (logs)
      console.log(`REGISTERS = [${int.registers.map((x) => `${x} (0x${x.toString(16)})`).join(", ")}]`);
    if (logs && int.pc < u32(int.program.code.length)) {
      const instruction2 = int.program.code[int.pc];
      const iData = instruction2 >= INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[instruction2];
      const skipBytes2 = int.program.mask.skipBytesToNextInstruction(int.pc);
      const args = resolveArguments(argsRes, iData.kind, int.program.code, int.pc + 1, skipBytes2, int.registers);
      if (args !== null) {
        console.log(`ARGUMENTS:
  ${args.a} (${args.decoded.a}) = 0x${u64(args.a).toString(16)},
  ${args.b} (${args.decoded.b}) = 0x${u64(args.b).toString(16)},
  ${args.c} (${args.decoded.c}) = 0x${u64(args.c).toString(16)},
  ${args.d} (${args.decoded.d}) = 0x${u64(args.d).toString(16)}`);
      }
    }
    isOk = int.nextSteps();
  }
}
function vmDestroy(int, dumpMemory = false) {
  const output = new VmOutput();
  output.status = int.status;
  output.registers = int.registers.slice(0);
  output.pc = int.pc;
  output.gas = int.gas.get();
  if (dumpMemory) {
    output.memory = getOutputChunks(int.memory);
  }
  output.exitCode = int.exitCode;
  output.result = readResult(int);
  int.memory.free();
  return output;
}
function readResult(int) {
  if (int.status !== Status.HALT) {
    return [];
  }
  const ptr_start = u32(int.registers[7] & u64(4294967295));
  const ptr_end = u32(int.registers[8] & u64(4294967295));
  if (ptr_start >= ptr_end) {
    return [];
  }
  const totalLength = ptr_end - ptr_start;
  if (totalLength > 1024 * 1024) {
    return [];
  }
  const result = new Uint8Array(totalLength);
  const faultRes4 = new MaybePageFault();
  int.memory.bytesRead(faultRes4, ptr_start, result, 0);
  if (faultRes4.isFault) {
    return [];
  }
  const out = new Array(totalLength);
  for (let i = 0; i < totalLength; i++) {
    out[i] = result[i];
  }
  return out;
}
function getOutputChunks(memory) {
  const chunks = [];
  const pages = portable.asArray(memory.pages.keys());
  let currentChunk = null;
  for (let i = 0; i < pages.length; i++) {
    const pageIdx = pages[i];
    const page = memory.pages.get(pageIdx);
    if (page.raw.page === null) {
      continue;
    }
    for (let n = 0; n < page.raw.data.length; n++) {
      const v = page.raw.data[n];
      if (v !== 0) {
        if (currentChunk !== null) {
          currentChunk.data.push(v);
        } else {
          currentChunk = new InitialChunk();
          currentChunk.address = pageIdx * PAGE_SIZE + n;
          currentChunk.data = [v];
        }
      } else if (currentChunk !== null) {
        chunks.push(currentChunk);
        currentChunk = null;
      }
    }
  }
  if (currentChunk !== null) {
    chunks.push(currentChunk);
  }
  return chunks;
}

// dist/build/js/assembly/spi.js
var MAX_ARGS_LEN = 2 ** 24;
var ARGS_SEGMENT_START = 2 ** 32 - SEGMENT_SIZE - MAX_ARGS_LEN;
var STACK_SEGMENT_END = ARGS_SEGMENT_START - SEGMENT_SIZE;
function decodeSpi(data, args, preallocateMemoryPages = 0) {
  const argsLength = args.length;
  if (argsLength > MAX_ARGS_LEN) {
    throw new Error(`Arguments length is too big. Got: ${argsLength}, max: ${MAX_ARGS_LEN}`);
  }
  const decoder = new Decoder(data);
  const roLength = decoder.u24();
  const rwLength = decoder.u24();
  const heapPages = decoder.u16();
  const stackSize = decoder.u24();
  const roMem = decoder.bytes(roLength);
  const rwMem = decoder.bytes(rwLength);
  const codeLength = decoder.u32();
  const code = decoder.bytes(codeLength);
  decoder.finish();
  const program = deblob(code);
  const builder = new MemoryBuilder(preallocateMemoryPages);
  const heapStart = 2 * SEGMENT_SIZE + alignToSegmentSize(roLength);
  const heapZerosStart = heapStart + alignToPageSize(rwLength);
  const heapZerosLength = heapPages * PAGE_SIZE;
  const stackLength = alignToPageSize(stackSize);
  const stackStart = STACK_SEGMENT_END - stackLength;
  if (roLength > 0) {
    builder.setData(Access.Read, SEGMENT_SIZE, roMem);
  }
  if (argsLength > 0) {
    builder.setData(Access.Read, ARGS_SEGMENT_START, args);
  }
  if (rwLength > 0) {
    builder.setData(Access.Write, heapStart, rwMem);
  }
  if (heapZerosLength > 0) {
    builder.setEmpty(Access.Write, heapZerosStart, heapZerosLength);
  }
  if (stackLength > 0) {
    builder.setEmpty(Access.Write, stackStart, stackLength);
  }
  const memory = builder.build(heapZerosStart + heapZerosLength, stackStart);
  const registers = newRegisters();
  registers[0] = 4294901760;
  registers[1] = STACK_SEGMENT_END;
  registers[7] = ARGS_SEGMENT_START;
  registers[8] = argsLength;
  return new StandardProgram(program, memory, registers);
}
function alignToPageSize(size) {
  return size + PAGE_SIZE - 1 >> PAGE_SIZE_SHIFT << PAGE_SIZE_SHIFT;
}
function alignToSegmentSize(size) {
  return size + SEGMENT_SIZE - 1 >> SEGMENT_SIZE_SHIFT << SEGMENT_SIZE_SHIFT;
}
var StandardProgram = class {
  constructor(program, memory, registers) {
    this.program = program;
    this.memory = memory;
    this.registers = registers;
    this.metadata = new Uint8Array(0);
  }
  toString() {
    return `StandardProgram { program: ${this.program}, memory_pages: ${this.memory.pages.size}, registers: ${this.registers} }`;
  }
};

// dist/build/js/assembly/api-debugger.js
var interpreter = null;
function resetJAM(program, pc, initialGas, args, hasMetadata = false) {
  const code = hasMetadata ? extractCodeAndMetadata(liftBytes(program)).code : liftBytes(program);
  const p = decodeSpi(code, liftBytes(args), 128);
  const int = new Interpreter(p.program, p.registers, p.memory);
  int.nextPc = pc;
  int.gas.set(initialGas);
  if (interpreter !== null) {
    interpreter.memory.free();
  }
  interpreter = int;
}
function resetGeneric(program, flatRegisters, initialGas, hasMetadata = false) {
  const code = hasMetadata ? extractCodeAndMetadata(liftBytes(program)).code : liftBytes(program);
  const p = deblob(code);
  const registers = newRegisters();
  fillRegisters(registers, flatRegisters);
  const int = new Interpreter(p, registers);
  int.gas.set(initialGas);
  if (interpreter !== null) {
    interpreter.memory.free();
  }
  interpreter = int;
}
function resetGenericWithMemory(program, flatRegisters, pageMap, chunks, initialGas, hasMetadata = false) {
  const code = hasMetadata ? extractCodeAndMetadata(liftBytes(program)).code : liftBytes(program);
  const p = deblob(code);
  const registers = newRegisters();
  fillRegisters(registers, flatRegisters);
  const builder = new MemoryBuilder();
  const memory = buildMemory(builder, readPages(pageMap), readChunks(chunks));
  const int = new Interpreter(p, registers, memory);
  int.gas.set(initialGas);
  interpreter = int;
}
function nextStep() {
  if (interpreter !== null) {
    const int = interpreter;
    return int.nextSteps();
  }
  return false;
}
function nSteps(steps) {
  if (interpreter !== null) {
    const int = interpreter;
    return int.nextSteps(steps);
  }
  return false;
}
function getProgramCounter() {
  if (interpreter === null) {
    return 0;
  }
  const int = interpreter;
  return u32(int.pc);
}
function setNextProgramCounter(pc) {
  if (interpreter === null) {
    return;
  }
  const int = interpreter;
  int.nextPc = pc;
}
function getStatus() {
  if (interpreter === null) {
    return Status.PANIC;
  }
  const int = interpreter;
  return int.status;
}
function getExitArg() {
  if (interpreter === null) {
    return 0;
  }
  const int = interpreter;
  return int.exitCode || 0;
}
function getGasLeft() {
  if (interpreter === null) {
    return i64(0);
  }
  const int = interpreter;
  return int.gas.get();
}
function setGasLeft(gas) {
  if (interpreter !== null) {
    const int = interpreter;
    int.gas.set(gas);
  }
}
function getRegisters() {
  const flat = new Uint8Array(NO_OF_REGISTERS * REG_SIZE_BYTES).fill(0);
  if (interpreter === null) {
    return flat;
  }
  const int = interpreter;
  for (let i = 0; i < int.registers.length; i++) {
    let val = int.registers[i];
    for (let j = 0; j < REG_SIZE_BYTES; j++) {
      const index = i * REG_SIZE_BYTES + j;
      flat[index] = val & u64(255);
      val = val >> u64(8);
    }
  }
  return flat;
}
function setRegisters(flatRegisters) {
  if (interpreter === null) {
    return;
  }
  const int = interpreter;
  fillRegisters(int.registers, flatRegisters);
}
function getPageDump(index) {
  if (interpreter === null) {
    return new Uint8Array(PAGE_SIZE).fill(0);
  }
  const int = interpreter;
  const page = int.memory.pageDump(index);
  if (page === null) {
    return new Uint8Array(PAGE_SIZE).fill(0);
  }
  return page;
}
function getPagePointer(page) {
  if (interpreter === null) {
    return 0;
  }
  const int = interpreter;
  return int.memory.getPagePointer(page);
}
function getMemory(address, length) {
  if (interpreter === null) {
    return null;
  }
  const int = interpreter;
  const faultRes4 = new MaybePageFault();
  const result = int.memory.getMemory(faultRes4, address, length);
  if (faultRes4.isFault) {
    return null;
  }
  return result;
}
function setMemory(address, data) {
  if (interpreter === null) {
    return false;
  }
  const int = interpreter;
  const end = address + data.length;
  const faultRes4 = new MaybePageFault();
  for (let i = address; i < end; i++) {
    int.memory.setU8(faultRes4, i, data[i - address]);
    if (faultRes4.isFault) {
      return false;
    }
  }
  return true;
}
function fillRegisters(registers, flat) {
  const len = registers.length * REG_SIZE_BYTES;
  if (len !== flat.length) {
    throw new Error(`Mismatching  registers size, got: ${flat.length}, expected: ${len}`);
  }
  for (let i = 0; i < registers.length; i++) {
    let num = u64(0);
    for (let j = 0; j < REG_SIZE_BYTES; j++) {
      const index = i * REG_SIZE_BYTES + j;
      num |= flat[index] << u64(j * 8);
    }
    registers[i] = num;
  }
}
function readPages(pageMap) {
  const pages = [];
  const codec = new Decoder(pageMap);
  while (!codec.isExhausted()) {
    const p = new InitialPage();
    p.address = codec.u32();
    p.length = codec.u32();
    p.access = codec.u8() > 0 ? Access.Write : Access.Read;
    pages.push(p);
  }
  return pages;
}
function readChunks(chunks) {
  const res = [];
  const codec = new Decoder(chunks);
  while (!codec.isExhausted()) {
    const c = new InitialChunk();
    c.address = codec.u32();
    const len = codec.u32();
    const data = codec.bytes(len);
    for (let i = 0; i < len; i++) {
      c.data.push(data[i]);
    }
    res.push(c);
  }
  return res;
}

// dist/build/js/assembly/gas-costs.js
var BlockGasCost = class {
  constructor() {
    this.pc = 0;
    this.gas = u64(0);
  }
};
function computeGasCosts(p) {
  const len = p.code.length;
  const blocks = /* @__PURE__ */ new Map();
  let currentBlock = null;
  for (let i = 0; i < len; i++) {
    if (!p.mask.isInstruction(i)) {
      throw new Error("We should iterate only over instructions!");
    }
    const instruction2 = p.code[i];
    const iData = instruction2 >= INSTRUCTIONS.length ? MISSING_INSTRUCTION : INSTRUCTIONS[instruction2];
    if (p.basicBlocks.isStart(i)) {
      if (currentBlock !== null) {
        blocks.set(currentBlock.pc, currentBlock);
      }
      currentBlock = new BlockGasCost();
      currentBlock.pc = i;
    }
    if (currentBlock !== null) {
      currentBlock.gas = portable.u64_add(currentBlock.gas, iData.gas);
    }
    const skipBytes2 = p.mask.skipBytesToNextInstruction(i);
    i += skipBytes2;
  }
  if (currentBlock !== null) {
    blocks.set(currentBlock.pc, currentBlock);
  }
  return blocks;
}

// dist/build/js/assembly/api-utils.js
var InputKind;
(function(InputKind2) {
  InputKind2[InputKind2["Generic"] = 0] = "Generic";
  InputKind2[InputKind2["SPI"] = 1] = "SPI";
})(InputKind || (InputKind = {}));
var HasMetadata;
(function(HasMetadata2) {
  HasMetadata2[HasMetadata2["Yes"] = 0] = "Yes";
  HasMetadata2[HasMetadata2["No"] = 1] = "No";
})(HasMetadata || (HasMetadata = {}));
function getGasCosts(input, kind, withMetadata) {
  const program = prepareProgram(kind, withMetadata, input, [], [], [], [], 0);
  return portable.asArray(computeGasCosts(program.program).values());
}
function disassemble(input, kind, withMetadata) {
  const program = prepareProgram(kind, withMetadata, input, [], [], [], [], 0);
  let output = "";
  if (withMetadata === HasMetadata.Yes) {
    output = "Metadata: \n";
    output += "0x";
    output += program.metadata.reduce((acc, x) => acc + x.toString(16).padStart(2, "0"), "");
    output += "\n\n";
  }
  output += getAssembly(program.program);
  return output;
}
function prepareProgram(kind, hasMetadata, program, initialRegisters, initialPageMap, initialMemory, args, preallocateMemoryPages) {
  let code = liftBytes(program);
  let metadata = new Uint8Array(0);
  if (hasMetadata === HasMetadata.Yes) {
    const data = extractCodeAndMetadata(code);
    code = data.code;
    metadata = data.metadata;
  }
  if (kind === InputKind.Generic) {
    const program2 = deblob(code);
    const builder = new MemoryBuilder(preallocateMemoryPages);
    const memory = buildMemory(builder, initialPageMap, initialMemory);
    const registers = newRegisters();
    const safeLen = initialRegisters.length < NO_OF_REGISTERS ? initialRegisters.length : NO_OF_REGISTERS;
    for (let r = 0; r < safeLen; r++) {
      registers[r] = initialRegisters[r];
    }
    const exe = new StandardProgram(program2, memory, registers);
    exe.metadata = metadata;
    return exe;
  }
  if (kind === InputKind.SPI) {
    const exe = decodeSpi(code, liftBytes(args), preallocateMemoryPages);
    exe.metadata = metadata;
    return exe;
  }
  throw new Error(`Unknown kind: ${kind}`);
}
function runProgram(program, initialGas = 0, programCounter = 0, logs = false, useSbrkGas = false, dumpMemory = false) {
  const vmInput = new VmInput(program.program, program.memory, program.registers);
  vmInput.gas = i64(initialGas);
  vmInput.pc = programCounter;
  const vmOptions = new VmRunOptions();
  vmOptions.logs = logs;
  vmOptions.useSbrkGas = useSbrkGas;
  vmOptions.dumpMemory = dumpMemory;
  return vmRunOnce(vmInput, vmOptions);
}
var nextPvmId = 0;
var pvms = /* @__PURE__ */ new Map();
function pvmStart(program, useSbrkGas = false) {
  const vmInput = new VmInput(program.program, program.memory, program.registers);
  nextPvmId += 1;
  pvms.set(nextPvmId, vmInit(vmInput, useSbrkGas));
  return nextPvmId;
}
function pvmDestroy(pvmId) {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    pvms.delete(pvmId);
    return vmDestroy(int, false);
  }
  return null;
}
function pvmSetRegisters(pvmId, registers) {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    const safeIter = registers.length < NO_OF_REGISTERS ? registers.length : NO_OF_REGISTERS;
    for (let i = 0; i < safeIter; i++) {
      int.registers[i] = registers[i];
    }
  }
}
function pvmReadMemory(pvmId, address, length) {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    const faultRes4 = new MaybePageFault();
    const result = int.memory.getMemory(faultRes4, address, length);
    if (!faultRes4.isFault) {
      return result;
    }
  }
  return null;
}
function pvmGetPagePointer(pvmId, page) {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    return int.memory.getPagePointer(page);
  }
  return 0;
}
function pvmWriteMemory(pvmId, address, data) {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    const faultRes4 = new MaybePageFault();
    const tempBuffer = new Uint8Array(data.length);
    int.memory.bytesRead(faultRes4, address, tempBuffer, 0);
    if (faultRes4.isFault) {
      return false;
    }
    faultRes4.isFault = false;
    faultRes4.isAccess = false;
    int.memory.bytesWrite(faultRes4, address, data, 0);
    if (!faultRes4.isFault) {
      return true;
    }
  }
  return false;
}
function pvmResume(pvmId, gas, pc, logs = false) {
  if (pvms.has(pvmId)) {
    const int = pvms.get(pvmId);
    int.nextPc = pc;
    int.gas.set(gas);
    vmExecute(int, logs);
    const pause = new VmPause();
    pause.status = int.status;
    pause.exitCode = int.exitCode;
    pause.pc = int.pc;
    pause.nextPc = int.nextPc;
    pause.gas = int.gas.get();
    pause.registers = int.registers.slice(0);
    return pause;
  }
  return null;
}

// dist/build/js/assembly/program-build.js
function wrapAsProgram(bytecode) {
  const jumpTableLength = 0;
  const jumpTableItemLength = 0;
  const codeLength = bytecode.length;
  const mask = buildMask(bytecode);
  const codeLengthBytes = encodeVarU32(codeLength);
  const data = new Uint8Array(1 + 1 + codeLengthBytes.length + codeLength + mask.length);
  data[0] = jumpTableLength;
  data[1] = jumpTableItemLength;
  let offset = 2;
  for (let i = 0; i < codeLengthBytes.length; i++) {
    data[offset] = codeLengthBytes[i];
    offset++;
  }
  for (let i = 0; i < bytecode.length; i++) {
    data[offset] = bytecode[i];
    offset++;
  }
  for (let i = 0; i < mask.length; i++) {
    data[offset] = mask[i];
    offset++;
  }
  return data;
}
function skipBytes(kind, data) {
  switch (kind) {
    case Arguments.Zero:
      return 0;
    case Arguments.OneImm:
      return immBytes(data.length, 0);
    case Arguments.TwoImm: {
      const low = lowNibble(data[0]);
      const split = low + 1;
      return 1 + split + immBytes(data.length, split + 1);
    }
    case Arguments.OneOff:
      return immBytes(data.length, 0);
    case Arguments.OneRegOneImm:
      return 1 + immBytes(data.length, 1);
    case Arguments.OneRegOneExtImm:
      return 9;
    case Arguments.OneRegTwoImm: {
      const hig = higNibble(data[0]);
      const split = hig + 1;
      return 1 + split + immBytes(data.length, 1 + split);
    }
    case Arguments.OneRegOneImmOneOff: {
      const hig = higNibble(data[0]);
      const split = hig + 1;
      return 1 + split + immBytes(data.length, 1 + split);
    }
    case Arguments.TwoReg:
      return 1;
    case Arguments.TwoRegOneImm:
      return 1 + minI32(4, data.length);
    case Arguments.TwoRegOneOff:
      return 1 + minI32(4, data.length);
    case Arguments.TwoRegTwoImm: {
      const low = lowNibble(data[1]);
      const split = low + 1;
      return 2 + split + immBytes(data.length, 2 + split);
    }
    case Arguments.ThreeReg:
      return 2;
    default:
      throw new Error(`Unhandled arguments kind: ${kind}`);
  }
}
function buildMask(bytecode) {
  const mask = new StaticArray(bytecode.length);
  for (let i = 0; i < bytecode.length; i++) {
    const instruction2 = bytecode[i];
    const iData = instruction2 < INSTRUCTIONS.length ? INSTRUCTIONS[instruction2] : MISSING_INSTRUCTION;
    mask[i] = true;
    const requiredBytes = REQUIRED_BYTES[iData.kind];
    if (i + 1 + requiredBytes <= bytecode.length) {
      i += skipBytes(iData.kind, bytecode.subarray(i + 1));
    }
  }
  const packed = [];
  for (let i = 0; i < mask.length; i += 8) {
    let byte = 0;
    for (let j = i; j < i + 8; j++) {
      byte >>= 1;
      if (j < mask.length && mask[j]) {
        byte |= 128;
      }
    }
    packed.push(byte);
  }
  return packed;
}
function immBytes(dataLength, required) {
  if (dataLength < required) {
    return 0;
  }
  return minI32(4, dataLength - required);
}
export {
  HasMetadata,
  InputKind,
  disassemble,
  getAssembly,
  getExitArg,
  getGasCosts,
  getGasLeft,
  getMemory,
  getPageDump,
  getPagePointer,
  getProgramCounter,
  getRegisters,
  getStatus,
  nSteps,
  nextStep,
  prepareProgram,
  pvmDestroy,
  pvmGetPagePointer,
  pvmReadMemory,
  pvmResume,
  pvmSetRegisters,
  pvmStart,
  pvmWriteMemory,
  resetGeneric,
  resetGenericWithMemory,
  resetJAM,
  runProgram,
  setGasLeft,
  setMemory,
  setNextProgramCounter,
  setRegisters,
  wrapAsProgram
};
