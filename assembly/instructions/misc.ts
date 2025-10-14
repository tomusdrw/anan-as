import { hostCall, InstructionRun, ok, okOrFault, panic } from "./outcome";
import { reg } from "./utils";

// INVALID
export const INVALID: InstructionRun = (r) => panic(r);

// TRAP
export const trap: InstructionRun = (r) => panic(r);

// FALLTHROUGH
export const fallthrough: InstructionRun = (r) => ok(r);

// ECALLI
export const ecalli: InstructionRun = (r, args) => hostCall(r, args.a);

// SBRK
export const sbrk: InstructionRun = (r, args, registers, memory) => {
  const res = memory.sbrk(u32(registers[reg(args.a)]));
  // out of memory
  if (res.fault.isFault) {
    return okOrFault(r, res.fault);
  }
  registers[reg(args.b)] = res.ok;
  return ok(r);
};
