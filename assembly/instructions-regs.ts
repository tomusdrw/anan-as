import { Args } from "./arguments";
import { reg } from "./instructions/utils";

export type RegisterIndex = u8;
export const UNUSED_REGISTER: RegisterIndex = 255;

export class UsedRegisters {
  source_1: RegisterIndex = UNUSED_REGISTER;
  source_2: RegisterIndex = UNUSED_REGISTER;
  destination: RegisterIndex = UNUSED_REGISTER;

  fill(source_1: u32, source_2: u32, destination: u32): void {
    if (source_1 !== UNUSED_REGISTER) {
      this.source_1 = u8(reg(source_1));
    }
    if (source_2 !== UNUSED_REGISTER) {
      this.source_2 = u8(reg(source_2));
    }
    if (destination !== UNUSED_REGISTER) {
      this.destination = u8(reg(destination));
    }
  }

  isSourceAndDestinationTheSame(): boolean {
    return this.source_1 === this.destination && this.source_2 === UNUSED_REGISTER;
  }
  isOverlapBetweenSourceAndDestination(): boolean {
    return this.source_1 === this.destination || this.source_2 === this.destination;
  }

  sourceOverlapsWith(vals: RegisterIndex[]): boolean {
    return vals.indexOf(this.source_1) !== -1 || vals.indexOf(this.source_2) !== -1;
  }

  destinationOverlapsWith(vals: RegisterIndex[]): boolean {
    return vals.indexOf(this.destination) !== -1;
  }

  computeOverlapWithSource(vals: RegisterIndex[]): RegisterIndex[] {
    const ret: RegisterIndex[] = [];
    if (vals.indexOf(this.source_1) !== -1) {
      ret.push(this.source_1);
    }
    if (vals.indexOf(this.source_2) !== -1) {
      ret.push(this.source_2);
    }
    return ret;
  }

  toString(): string {
    let s = `UsedRegisters [`;
    if (this.source_1 !== UNUSED_REGISTER) {
      s += `S${this.source_1}, `;
    }
    if (this.source_2 !== UNUSED_REGISTER) {
      s += `S${this.source_2}, `;
    }
    if (this.destination !== UNUSED_REGISTER) {
      s += `D${this.destination}`;
    }
    s += "]";
    return s;
  }
}

// TODO [ToDr] might be simpler to have separate enum/fpointer in `INSTRUCTIONS` instead!
type RegisterFill = (args: Args, regs: UsedRegisters) => void;
const NO_REGISTERS: RegisterFill = (_args, regs) => {
  regs.fill(UNUSED_REGISTER, UNUSED_REGISTER, UNUSED_REGISTER);
};

const A_DESTINATION_REG: RegisterFill = (args, regs) => {
  regs.fill(UNUSED_REGISTER, UNUSED_REGISTER, args.a);
};

const A_SOURCE_REG: RegisterFill = (args, regs) => {
  regs.fill(args.a, UNUSED_REGISTER, UNUSED_REGISTER);
};

const A_SOURCE_B_DESTINATION_REG: RegisterFill = (args, regs) => {
  regs.fill(args.a, UNUSED_REGISTER, args.b);
};

const A_SOURCE_B_SOURCE_REG: RegisterFill = (args, regs) => {
  regs.fill(args.a, args.b, UNUSED_REGISTER);
};

const ABC_REG: RegisterFill = (args, regs) => {
  regs.fill(args.a, args.b, args.c);
};

export const REGISTERS: RegisterFill[] = [
  /* 000 */ NO_REGISTERS, // trap
  /* 001 */ NO_REGISTERS, // fallthrough
  NO_REGISTERS,
  /* 003 */ NO_REGISTERS, // unlikely
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 010 */ NO_REGISTERS, // ecalli
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 020 */ A_DESTINATION_REG, // load_imm_64
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 030 */ NO_REGISTERS, // store_imm
  /* 031 */ NO_REGISTERS,
  /* 032 */ NO_REGISTERS,
  /* 033 */ NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 040 */ NO_REGISTERS, // jump
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 050 */ A_SOURCE_REG, // jump_ind
  /* 051 */ A_DESTINATION_REG, // load_imm
  /* 052 */ A_DESTINATION_REG, // load
  /* 053 */ A_DESTINATION_REG,
  /* 054 */ A_DESTINATION_REG,
  /* 055 */ A_DESTINATION_REG,
  /* 056 */ A_DESTINATION_REG,
  /* 057 */ A_DESTINATION_REG,
  /* 058 */ A_DESTINATION_REG,
  /* 059 */ A_SOURCE_REG, // store

  /* 060 */ A_SOURCE_REG,
  /* 061 */ A_SOURCE_REG,
  /* 062 */ A_SOURCE_REG,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 070 */ A_SOURCE_REG, // store_imm_ind
  /* 071 */ A_SOURCE_REG,
  /* 072 */ A_SOURCE_REG,
  /* 073 */ A_SOURCE_REG,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 080 */ A_DESTINATION_REG, // load_imm_jump
  /* 081 */ A_SOURCE_REG, // branching
  /* 082 */ A_SOURCE_REG,
  /* 083 */ A_SOURCE_REG,
  /* 084 */ A_SOURCE_REG,
  /* 085 */ A_SOURCE_REG,
  /* 086 */ A_SOURCE_REG,
  /* 087 */ A_SOURCE_REG,
  /* 088 */ A_SOURCE_REG,
  /* 089 */ A_SOURCE_REG,

  /* 090 */ A_SOURCE_REG,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 100 */ A_SOURCE_B_DESTINATION_REG, // move _reg
  /* 101 */ A_SOURCE_B_DESTINATION_REG, // sbrk
  /* 102 */ A_SOURCE_B_DESTINATION_REG, // bit ops
  /* 103 */ A_SOURCE_B_DESTINATION_REG,
  /* 104 */ A_SOURCE_B_DESTINATION_REG,
  /* 105 */ A_SOURCE_B_DESTINATION_REG,
  /* 106 */ A_SOURCE_B_DESTINATION_REG,
  /* 107 */ A_SOURCE_B_DESTINATION_REG,
  /* 108 */ A_SOURCE_B_DESTINATION_REG, //sign extend
  /* 109 */ A_SOURCE_B_DESTINATION_REG,

  /* 110 */ A_SOURCE_B_DESTINATION_REG,
  /* 111 */ A_SOURCE_B_DESTINATION_REG,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 120 */ A_SOURCE_B_SOURCE_REG, // store_ind
  /* 121 */ A_SOURCE_B_SOURCE_REG,
  /* 122 */ A_SOURCE_B_SOURCE_REG,
  /* 123 */ A_SOURCE_B_SOURCE_REG,
  /* 124 */ A_SOURCE_B_DESTINATION_REG, // load_ind
  /* 125 */ A_SOURCE_B_DESTINATION_REG,
  /* 126 */ A_SOURCE_B_DESTINATION_REG,
  /* 127 */ A_SOURCE_B_DESTINATION_REG,
  /* 128 */ A_SOURCE_B_DESTINATION_REG,
  /* 129 */ A_SOURCE_B_DESTINATION_REG,

  /* 130 */ A_SOURCE_B_DESTINATION_REG,
  /* 131 */ A_SOURCE_B_DESTINATION_REG, // add_imm
  /* 132 */ A_SOURCE_B_DESTINATION_REG, // and_imm
  /* 133 */ A_SOURCE_B_DESTINATION_REG, // xor_imm
  /* 134 */ A_SOURCE_B_DESTINATION_REG, // or_imm
  /* 135 */ A_SOURCE_B_DESTINATION_REG, // mul_imm
  /* 136 */ A_SOURCE_B_DESTINATION_REG, //set
  /* 137 */ A_SOURCE_B_DESTINATION_REG,
  /* 138 */ A_SOURCE_B_DESTINATION_REG, // shlo
  /* 139 */ A_SOURCE_B_DESTINATION_REG,

  /* 140 */ A_SOURCE_B_DESTINATION_REG,
  /* 141 */ A_SOURCE_B_DESTINATION_REG,
  /* 142 */ A_SOURCE_B_DESTINATION_REG,
  /* 143 */ A_SOURCE_B_DESTINATION_REG,
  /* 144 */ A_SOURCE_B_DESTINATION_REG,
  /* 145 */ A_SOURCE_B_DESTINATION_REG,
  /* 146 */ A_SOURCE_B_DESTINATION_REG,
  /* 147 */ A_SOURCE_B_DESTINATION_REG, // cmov
  /* 148 */ A_SOURCE_B_DESTINATION_REG,
  /* 149 */ A_SOURCE_B_DESTINATION_REG, // add_imm_64

  /* 150 */ A_SOURCE_B_DESTINATION_REG,
  /* 151 */ A_SOURCE_B_DESTINATION_REG,
  /* 152 */ A_SOURCE_B_DESTINATION_REG,
  /* 153 */ A_SOURCE_B_DESTINATION_REG,
  /* 154 */ A_SOURCE_B_DESTINATION_REG,
  /* 155 */ A_SOURCE_B_DESTINATION_REG,
  /* 156 */ A_SOURCE_B_DESTINATION_REG,
  /* 157 */ A_SOURCE_B_DESTINATION_REG,
  /* 158 */ A_SOURCE_B_DESTINATION_REG,
  /* 159 */ A_SOURCE_B_DESTINATION_REG,

  /* 160 */ A_SOURCE_B_DESTINATION_REG,
  /* 161 */ A_SOURCE_B_DESTINATION_REG,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 170 */ A_SOURCE_B_SOURCE_REG, // branch
  /* 171 */ A_SOURCE_B_SOURCE_REG,
  /* 172 */ A_SOURCE_B_SOURCE_REG,
  /* 173 */ A_SOURCE_B_SOURCE_REG,
  /* 174 */ A_SOURCE_B_SOURCE_REG,
  /* 175 */ A_SOURCE_B_SOURCE_REG,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 180 */ A_SOURCE_B_DESTINATION_REG, // load_imm_jump_ind
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,
  NO_REGISTERS,

  /* 190 */ ABC_REG, // math / add
  /* 191 */ ABC_REG,
  /* 192 */ ABC_REG,
  /* 193 */ ABC_REG,
  /* 194 */ ABC_REG,
  /* 195 */ ABC_REG,
  /* 196 */ ABC_REG,
  /* 197 */ ABC_REG,
  /* 198 */ ABC_REG,
  /* 199 */ ABC_REG,

  /* 200 */ ABC_REG,
  /* 201 */ ABC_REG,
  /* 202 */ ABC_REG,
  /* 203 */ ABC_REG,
  /* 204 */ ABC_REG,
  /* 205 */ ABC_REG,
  /* 206 */ ABC_REG,
  /* 207 */ ABC_REG,
  /* 208 */ ABC_REG,
  /* 209 */ ABC_REG,

  /* 210 */ ABC_REG,
  /* 211 */ ABC_REG,
  /* 212 */ ABC_REG,
  /* 213 */ ABC_REG,
  /* 214 */ ABC_REG,
  /* 215 */ ABC_REG,
  /* 216 */ ABC_REG,
  /* 217 */ ABC_REG,
  /* 218 */ ABC_REG,
  /* 219 */ ABC_REG,

  /* 220 */ ABC_REG,
  /* 221 */ ABC_REG,
  /* 222 */ ABC_REG,
  /* 223 */ ABC_REG,
  /* 224 */ ABC_REG,
  /* 225 */ ABC_REG,
  /* 226 */ ABC_REG,
  /* 227 */ ABC_REG,
  /* 228 */ ABC_REG,
  /* 229 */ ABC_REG,

  /* 230 */ ABC_REG,
];
