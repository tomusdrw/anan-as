import { InstructionRun, hostCall, ok, okOrFault, panic } from "./outcome";
import { reg } from "./utils";

// INVALID
export const INVALID: InstructionRun = () => panic();

// TRAP
export const trap: InstructionRun = () => panic();

// FALLTHROUGH
export const fallthrough: InstructionRun = () => ok();

// ECALLI
export const ecalli: InstructionRun = (args) => hostCall(args.a);

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
