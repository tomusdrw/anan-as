/** Number of virtual CPU execution units required to start execution of the opcode. */
export class OpsCost {
  /** Number of accumulator register access? */
  A: u32 = 4;
  /** Number of memory reads (loads). */
  L: u32 = 4;
  /** Number of memory writes (store). */
  S: u32 = 4;
  /** Number of multiplications. */
  M: u32 = 1;
  /** Number of divisions. */
  D: u32 = 1;

  toString(): string {
    return `OpsCost{ A:${this.A}, L:${this.L}, S:${this.S}, M:${this.M}, D:${this.D} }`;
  }

  static alsmd(a: u32, l: u32, s: u32, m: u32, d: u32): OpsCost {
    return new OpsCost(a, l, s, m, d);
  }

  static zero(): OpsCost {
    return new OpsCost(0, 0, 0, 0, 0);
  }

  private constructor(A: u32, L: u32, S: u32, M: u32, D: u32) {
    this.A = A;
    this.L = L;
    this.S = S;
    this.M = M;
    this.D = D;
  }

  subtract(other: OpsCost): OpsCost {
    const res = OpsCost.zero();
    res.A = this.A - other.A;
    res.L = this.L - other.L;
    res.S = this.S - other.S;
    res.M = this.M - other.M;
    res.D = this.D - other.D;
    return res;
  }

  add(other: OpsCost): OpsCost {
    const res = OpsCost.zero();
    res.A = this.A + other.A;
    res.L = this.L + other.L;
    res.S = this.S + other.S;
    res.M = this.M + other.M;
    res.D = this.D + other.D;
    return res;
  }

  isLessOrEqual(other: OpsCost): boolean {
    return this.A <= other.A && this.L <= other.L && this.S <= other.S && this.M <= other.M && this.D <= other.D;
  }
}
