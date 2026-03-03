import { MaybePageFault } from "../memory";
import { InstructionRun, OutcomeData } from "./outcome";
import { Inst } from "./utils";

const faultRes = new MaybePageFault();

// INVALID
export const INVALID: InstructionRun = (r) => OutcomeData.panic(r);

// TRAP
export const trap: InstructionRun = (r) => OutcomeData.panic(r);

// FALLTHROUGH
export const fallthrough: InstructionRun = (r) => OutcomeData.ok(r);

// ECALLI
export const ecalli: InstructionRun = (r, args) => OutcomeData.hostCall(r, args.a);

// SBRK
export const sbrk: InstructionRun = (r, args, registers, memory) => {
  const res = memory.sbrk(faultRes, u32(registers[Inst.reg(args.a)]));
  // out of memory
  if (faultRes.isFault) {
    return OutcomeData.okOrFault(r, faultRes);
  }
  registers[Inst.reg(args.b)] = res;
  return OutcomeData.ok(r);
};
