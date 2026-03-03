/** Gas type. */
export type Gas = u64;

/** Create a new gas counter instance. */
export function gasCounter(gas: Gas): GasCounter {
  return new GasCounter(gas);
}

export class GasCounter {
  constructor(private gas: Gas) {}

  set(g: Gas): void {
    this.gas = g;
  }

  get(): Gas {
    return this.gas;
  }

  @inline
  sub(g: u32): boolean {
    const cost = u64(g);
    if (cost > this.gas) {
      this.gas = u64(0);
      return true;
    }
    this.gas = this.gas - cost;
    return false;
  }
}
