/** Gas type. */
export type Gas = i64;

/** Create a new gas counter instance depending on the gas value. */
export function gasCounter(gas: i64): GasCounter {
  return new GasCounterU64(gas);
}

/** An abstraction over gas counter.
 *
 * It can be optimized to use numbers instead of bigint in case of small gas.
 */
export interface GasCounter {
  /** Return remaining gas. */
  get(): Gas;

  /** Overwite remaining gas. Prefer sub method instead. */
  set(g: Gas): void;

  /** Returns true if there was an underflow. */
  sub(g: Gas): boolean;
}

class GasCounterU64 implements GasCounter {
  constructor(private gas: Gas) {}

  set(g: Gas): void {
    this.gas = i64(g);
  }

  get(): Gas {
    return this.gas;
  }

  sub(g: Gas): boolean {
    this.gas = this.gas - g;
    if (this.gas < 0) {
      this.gas = i64(0);
      return true;
    }
    return false;
  }
}
