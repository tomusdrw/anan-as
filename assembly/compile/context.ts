import { Args } from "../arguments";
import { NO_OF_REGISTERS } from "../registers";

export class CompileContext {
  public readonly data: string[] = [];
  public readonly bufferedBlock: string[] = [];
  public pc: u32 = 0;

  flushBlockBuffer(): void {
    for (let i = 0; i < this.bufferedBlock.length; i++) {
      this.data.push(this.bufferedBlock[i]);
    }
    this.bufferedBlock.length = 0;
  }

  push(v: string): void {
    this.data.push(v);
  }

  addBlockLine(x: string, args: Args = new Args()): void {
    let v = x;
    // some replacing happens here
    v = v
      .replace("args.a", `${args.a}`)
      .replace("args.b", `${args.b}`)
      .replace("args.c", `${args.c}`)
      .replace("args.d", `${args.d}`);
    for (let i = 0; i < NO_OF_REGISTERS; i++) {
      for (let j = 0; j < 3; j++) {
        v = v.replace(`regs[${i}]`, `regs${i}`);
      }
    }

    this.bufferedBlock.push(`  ${v}`);
  }

  staticJump(arg: u32): void {
    this.addBlockLine(`  return block${this.pc + arg}(); // ${this.pc} + ${arg}`);
  }

  panic(): void {
    this.addBlockLine("  trap(); abort();");
  }

  hostCall(num: u32): void {
    this.addBlockLine(`  host(${num})`);
  }

  okOrFault(v: string): void {
    this.addBlockLine(`  if (${v}.isFault) { fault(0); abort(); }`);
  }

  dJump(v: string): void {
    // TODO ToDr this must be using the jump table
    this.addBlockLine(`  // dynamic jump to ${v}`);
  }

  startBlock(pc: u32): void {
    this.push(`function block${pc}(): void {`);
  }

  endBlock(blockGas: i64): void {
    this.push(`  gas -= ${blockGas};`);
    this.push("  if (gas < 0) { outOfGas(); }");
    this.flushBlockBuffer();
    this.push("}");
  }
}
