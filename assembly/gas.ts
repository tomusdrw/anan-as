/** Gas type. */
export type Gas = i64;

/** Create a new gas counter instance. */
export function gasCounter(gas: i64): GasCounter {
  return new GasCounter(gas);
}

export class GasCounter {
  constructor(private gas: Gas) {}

  set(g: Gas): void {
    this.gas = i64(g);
  }

  get(): Gas {
    return this.gas;
  }

  @inline
  sub(g: Gas): boolean {
    this.gas = this.gas - i64(g);
    if (this.gas < i64(0)) {
      this.gas = i64(0);
      return true;
    }
    return false;
  }
}
