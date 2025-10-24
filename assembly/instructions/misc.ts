import { MaybePageFault } from "../memory";
import { hostCall, InstructionRun, ok, okOrFault, panic } from "./outcome";
import { reg } from "./utils";

const faultRes = new MaybePageFault();

// INVALID
export const INVALID: InstructionRun = (r) => panic(r);

// TRAP
export const trap: InstructionRun = (r) => panic(r);

// FALLTHROUGH
export const fallthrough: InstructionRun = (r) => ok(r);

// UNLIKELY
export const unlikely: InstructionRun = (r) => ok(r);

// ECALLI
export const ecalli: InstructionRun = (r, args) => hostCall(r, args.a);

// SBRK
export const sbrk: InstructionRun = (r, args, registers, memory) => {
  const res = memory.sbrk(faultRes, u32(registers[reg(args.a)]));
  // out of memory
  if (faultRes.isFault) {
    return okOrFault(r, faultRes);
  }
  registers[reg(args.b)] = res;
  return ok(r);
};
