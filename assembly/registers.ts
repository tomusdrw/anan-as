type Register = u64;

export const NO_OF_REGISTERS = 13;
export const REG_SIZE_BYTES = 8;

export type Registers = StaticArray<Register>;

export function newRegisters(): Registers {
  return new StaticArray<Register>(NO_OF_REGISTERS);
}
