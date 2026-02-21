export class Test {
  constructor(
    public name: string,
    public ptr: (assert: Assert) => Assert,
  ) {}
}

export class Assert {
  public isOkay: boolean = true;
  public errors: string[] = [];

  static todo(): Assert {
    const r = new Assert();
    r.fail("Not implemented yet!");
    return r;
  }

  fail(msg: string): void {
    this.isOkay = false;
    this.errors.push(msg);
  }

  isArrayEqual<T>(actual: T[], expected: T[], msg: string = ""): void {
    this.isEqual(actual.length, expected.length, `length @ ${msg}`);
    this.isEqual(actual.join(",").toString(), expected.join(",").toString(), msg);
  }

  isEqual<T>(actual: T, expected: T, msg: string = ""): void {
    if (actual !== expected) {
      this.isOkay = false;
      const actualDisplay = isInteger(actual) ? `${actual} (0x${i64(actual).toString(16)})` : `${actual}`;
      const expectDisplay = isInteger(expected) ? `${expected} (0x${i64(expected).toString(16)})` : `${expected}`;
      this.errors.push(`Got: '${actualDisplay}', expected: '${expectDisplay}' @ ${msg}`);
    }
  }

  isNotEqual<T>(actual: T, unexpected: T, msg: string = ""): void {
    if (actual === unexpected) {
      this.isOkay = false;
      const actualDisplay = isInteger(actual) ? `${actual} (0x${i64(actual).toString(16)})` : `${actual}`;
      this.errors.push(`Expected value to differ from: '${actualDisplay}' @ ${msg}`);
    }
  }
}

export function test(name: string, ptr: (assert: Assert) => Assert): Test {
  return new Test(name, ptr);
}
