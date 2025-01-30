import { InstructionRun, hostCall, ok, okOrFault, panic } from "./outcome";
import { reg } from "./utils";

// INVALID
export const INVALID: InstructionRun = () => {
  return panic();
};

// TRAP
export const trap: InstructionRun = () => {
  return panic();
};

// FALLTHROUGH
export const fallthrough: InstructionRun = () => {
  return ok();
};

// ECALLI
export const ecalli: InstructionRun = (args) => {
  return hostCall(args.a);
};

// SBRK
export const sbrk: InstructionRun = (args, registers, memory) => {
  const res = memory.sbrk(u32(registers[reg(args.a)]));
  // out of memory
  if (res.fault.isFault) {
    return okOrFault(res.fault);
  }
  registers[reg(args.b)] = res.ok;
  return ok();
};
