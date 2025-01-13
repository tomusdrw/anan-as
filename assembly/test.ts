export class Test {
  constructor(
    public name: string,
    public ptr: () => Assert,
  ) {}
}

export class Assert {
  public isOkay: boolean = true;
  public errors: string[] = [];

  isEqual<T>(actual: T, expected: T, msg: string = ""): void {
    if (actual !== expected) {
      this.isOkay = false;
      this.errors.push(`Got: ${actual}, expected: ${expected} @ ${msg}`);
    }
  }
}

export function test(name: string, ptr: () => Assert): Test {
  return new Test(name, ptr);
}
