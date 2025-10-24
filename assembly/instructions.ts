import { Arguments } from "./arguments";
import { Gas } from "./gas";
import {OpsCost} from "./gas-pricing";

@unmanaged
export class Instruction {
  /** Pointer to string name of the instruction. */
  namePtr: usize = 0;
  /** Number of arguments needed. */
  kind: Arguments = Arguments.Zero;
  /** Legacy gas cost */
  gas: Gas = 0;
  /** Does the instruction terminate block? */
  isTerminating: boolean = false;
  /** c_revhat */
  constantCost: u32 = 0;
  /** d_revhat in case of source & destination register overlap (variant a) */
  registerCostOverlap: u32 = 0;
  /** d_revhat (variant b) */
  registerCost: u32 = 0;
  /** x_revhat */
  opsCost: OpsCost = OpsCost.zero();
}

/** Sentinel value for memory operation costs (which depends on the memory model) */
export const MEMORY_COST = 2**32 - 1;
export const MEMORY_COST_L2HIT = 25;
export const MEMORY_COST_L3HIT = 37;

function instruction(
  name: string,
  kind: Arguments,
): Builder {
  const b = new Builder();
  return b.name(name, kind);
}

export const MISSING_INSTRUCTION = instruction("INVALID", Arguments.Zero)
  .gas(1)
  .cost(1)
  .regCost(0)
  .opsCost(0, 0, 0, 0, 0)
  .done();

export const SBRK = instruction("SBRK", Arguments.TwoReg).gas(1).cost(1).done();

export const INSTRUCTIONS: Instruction[] = [
  /* 000 */ instruction("TRAP", Arguments.Zero).gas(1).isTerminating(true).done(),
  /* 001 */ instruction("FALLTHROUGH", Arguments.Zero).gas(1).isTerminating(true).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 010 */ instruction("ECALLI", Arguments.OneImm).gas(1).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 020 */ instruction("LOAD_IMM_64", Arguments.OneRegOneExtImm).gas(1).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 030 */ instruction("STORE_IMM_U8", Arguments.TwoImm).gas(1).done(),
  /* 031 */ instruction("STORE_IMM_U16", Arguments.TwoImm).gas(1).done(),
  /* 032 */ instruction("STORE_IMM_U32", Arguments.TwoImm).gas(1).done(),
  /* 033 */ instruction("STORE_IMM_U64", Arguments.TwoImm).gas(1).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 040 */ instruction("JUMP", Arguments.OneOff).gas(1).isTerminating(true).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 050 */ instruction("JUMP_IND", Arguments.OneRegOneImm).gas(1).isTerminating(true).done(),
  /* 051 */ instruction("LOAD_IMM", Arguments.OneRegOneImm).gas(1).done(),
  /* 052 */ instruction("LOAD_U8", Arguments.OneRegOneImm).gas(1).done(),
  /* 053 */ instruction("LOAD_I8", Arguments.OneRegOneImm).gas(1).done(),
  /* 054 */ instruction("LOAD_U16", Arguments.OneRegOneImm).gas(1).done(),
  /* 055 */ instruction("LOAD_I16", Arguments.OneRegOneImm).gas(1).done(),
  /* 056 */ instruction("LOAD_U32", Arguments.OneRegOneImm).gas(1).done(),
  /* 057 */ instruction("LOAD_I32", Arguments.OneRegOneImm).gas(1).done(),
  /* 058 */ instruction("LOAD_U64", Arguments.OneRegOneImm).gas(1).done(),
  /* 059 */ instruction("STORE_U8", Arguments.OneRegOneImm).gas(1).done(),

  /* 060 */ instruction("STORE_U16", Arguments.OneRegOneImm).gas(1).done(),
  /* 061 */ instruction("STORE_U32", Arguments.OneRegOneImm).gas(1).done(),
  /* 062 */ instruction("STORE_U64", Arguments.OneRegOneImm).gas(1).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 070 */ instruction("STORE_IMM_IND_U8", Arguments.OneRegTwoImm).gas(1).done(),
  /* 071 */ instruction("STORE_IMM_IND_U16", Arguments.OneRegTwoImm).gas(1).done(),
  /* 072 */ instruction("STORE_IMM_IND_U32", Arguments.OneRegTwoImm).gas(1).done(),
  /* 073 */ instruction("STORE_IMM_IND_U64", Arguments.OneRegTwoImm).gas(1).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 080 */ instruction("LOAD_IMM_JUMP", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  /* 081 */ instruction("BRANCH_EQ_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  /* 082 */ instruction("BRANCH_NE_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  /* 083 */ instruction("BRANCH_LT_U_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  /* 084 */ instruction("BRANCH_LE_U_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  /* 085 */ instruction("BRANCH_GE_U_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  /* 086 */ instruction("BRANCH_GT_U_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  /* 087 */ instruction("BRANCH_LT_S_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  /* 088 */ instruction("BRANCH_LE_S_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  /* 089 */ instruction("BRANCH_GE_S_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),

  /* 090 */ instruction("BRANCH_GT_S_IMM", Arguments.OneRegOneImmOneOff).gas(1).isTerminating(true).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 100 */ instruction("MOVE_REG", Arguments.TwoReg).gas(1).done(),
  /* 101 */ SBRK,
  /* 102 */ instruction("COUNT_SET_BITS_64", Arguments.TwoReg).gas(1).done(),
  /* 103 */ instruction("COUNT_SET_BITS_32", Arguments.TwoReg).gas(1).done(),
  /* 104 */ instruction("LEADING_ZERO_BITS_64", Arguments.TwoReg).gas(1).done(),
  /* 105 */ instruction("LEADING_ZERO_BITS_32", Arguments.TwoReg).gas(1).done(),
  /* 106 */ instruction("TRAILING_ZERO_BITS_64", Arguments.TwoReg).gas(1).done(),
  /* 107 */ instruction("TRAILING_ZERO_BITS_32", Arguments.TwoReg).gas(1).done(),
  /* 108 */ instruction("SIGN_EXTEND_8", Arguments.TwoReg).gas(1).done(),
  /* 109 */ instruction("SIGN_EXTEND_16", Arguments.TwoReg).gas(1).done(),

  /* 110 */ instruction("ZERO_EXTEND_16", Arguments.TwoReg).gas(1).done(),
  /* 111 */ instruction("REVERSE_BYTES", Arguments.TwoReg).gas(1).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 120 */ instruction("STORE_IND_U8", Arguments.TwoRegOneImm).gas(1).done(),
  /* 121 */ instruction("STORE_IND_U16", Arguments.TwoRegOneImm).gas(1).done(),
  /* 122 */ instruction("STORE_IND_U32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 123 */ instruction("STORE_IND_U64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 124 */ instruction("LOAD_IND_U8", Arguments.TwoRegOneImm).gas(1).done(),
  /* 125 */ instruction("LOAD_IND_I8", Arguments.TwoRegOneImm).gas(1).done(),
  /* 126 */ instruction("LOAD_IND_U16", Arguments.TwoRegOneImm).gas(1).done(),
  /* 127 */ instruction("LOAD_IND_I16", Arguments.TwoRegOneImm).gas(1).done(),
  /* 128 */ instruction("LOAD_IND_U32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 129 */ instruction("LOAD_IND_I32", Arguments.TwoRegOneImm).gas(1).done(),

  /* 130 */ instruction("LOAD_IND_U64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 131 */ instruction("ADD_IMM_32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 132 */ instruction("AND_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 133 */ instruction("XOR_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 134 */ instruction("OR_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 135 */ instruction("MUL_IMM_32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 136 */ instruction("SET_LT_U_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 137 */ instruction("SET_LT_S_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 138 */ instruction("SHLO_L_IMM_32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 139 */ instruction("SHLO_R_IMM_32", Arguments.TwoRegOneImm).gas(1).done(),

  /* 140 */ instruction("SHAR_R_IMM_32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 141 */ instruction("NEG_ADD_IMM_32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 142 */ instruction("SET_GT_U_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 143 */ instruction("SET_GT_S_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 144 */ instruction("SHLO_L_IMM_ALT_32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 145 */ instruction("SHLO_R_IMM_ALT_32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 146 */ instruction("SHAR_R_IMM_ALT_32", Arguments.TwoRegOneImm).gas(1).done(),
  /* 147 */ instruction("CMOV_IZ_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 148 */ instruction("CMOV_NZ_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 149 */ instruction("ADD_IMM_64", Arguments.TwoRegOneImm).gas(1).done(),

  /* 150 */ instruction("MUL_IMM_64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 151 */ instruction("SHLO_L_IMM_64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 152 */ instruction("SHLO_R_IMM_64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 153 */ instruction("SHAR_R_IMM_64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 154 */ instruction("NEG_ADD_IMM_64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 155 */ instruction("SHLO_L_IMM_ALT_64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 156 */ instruction("SHLO_R_IMM_ALT_64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 157 */ instruction("SHAR_R_IMM_ALT_64", Arguments.TwoRegOneImm).gas(1).done(),
  /* 158 */ instruction("ROT_R_64_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 159 */ instruction("ROT_R_64_IMM_ALT", Arguments.TwoRegOneImm).gas(1).done(),

  /* 160 */ instruction("ROT_R_32_IMM", Arguments.TwoRegOneImm).gas(1).done(),
  /* 161 */ instruction("ROT_R_32_IMM_ALT", Arguments.TwoRegOneImm).gas(1).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 170 */ instruction("BRANCH_EQ", Arguments.TwoRegOneOff).gas(1).isTerminating(true).done(),
  /* 171 */ instruction("BRANCH_NE", Arguments.TwoRegOneOff).gas(1).isTerminating(true).done(),
  /* 172 */ instruction("BRANCH_LT_U", Arguments.TwoRegOneOff).gas(1).isTerminating(true).done(),
  /* 173 */ instruction("BRANCH_LT_S", Arguments.TwoRegOneOff).gas(1).isTerminating(true).done(),
  /* 174 */ instruction("BRANCH_GE_U", Arguments.TwoRegOneOff).gas(1).isTerminating(true).done(),
  /* 175 */ instruction("BRANCH_GE_S", Arguments.TwoRegOneOff).gas(1).isTerminating(true).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 180 */ instruction("LOAD_IMM_JUMP_IND", Arguments.TwoRegTwoImm).gas(1).isTerminating(true).done(),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  /* 190 */ instruction("ADD_32", Arguments.ThreeReg).gas(1).done(),
  /* 191 */ instruction("SUB_32", Arguments.ThreeReg).gas(1).done(),
  /* 192 */ instruction("MUL_32", Arguments.ThreeReg).gas(1).done(),
  /* 193 */ instruction("DIV_U_32", Arguments.ThreeReg).gas(1).done(),
  /* 194 */ instruction("DIV_S_32", Arguments.ThreeReg).gas(1).done(),
  /* 195 */ instruction("REM_U_32", Arguments.ThreeReg).gas(1).done(),
  /* 196 */ instruction("REM_S_32", Arguments.ThreeReg).gas(1).done(),
  /* 197 */ instruction("SHLO_L_32", Arguments.ThreeReg).gas(1).done(),
  /* 198 */ instruction("SHLO_R_32", Arguments.ThreeReg).gas(1).done(),
  /* 199 */ instruction("SHAR_R_32", Arguments.ThreeReg).gas(1).done(),

  /* 200 */ instruction("ADD_64", Arguments.ThreeReg).gas(1).done(),
  /* 201 */ instruction("SUB_64", Arguments.ThreeReg).gas(1).done(),
  /* 202 */ instruction("MUL_64", Arguments.ThreeReg).gas(1).done(),
  /* 203 */ instruction("DIV_U_64", Arguments.ThreeReg).gas(1).done(),
  /* 204 */ instruction("DIV_S_64", Arguments.ThreeReg).gas(1).done(),
  /* 205 */ instruction("REM_U_64", Arguments.ThreeReg).gas(1).done(),
  /* 206 */ instruction("REM_S_64", Arguments.ThreeReg).gas(1).done(),
  /* 207 */ instruction("SHLO_L_64", Arguments.ThreeReg).gas(1).done(),
  /* 208 */ instruction("SHLO_R_64", Arguments.ThreeReg).gas(1).done(),
  /* 209 */ instruction("SHAR_R_64", Arguments.ThreeReg).gas(1).done(),

  /* 210 */ instruction("AND", Arguments.ThreeReg).gas(1).done(),
  /* 211 */ instruction("XOR", Arguments.ThreeReg).gas(1).done(),
  /* 212 */ instruction("OR", Arguments.ThreeReg).gas(1).done(),
  /* 213 */ instruction("MUL_UPPER_S_S", Arguments.ThreeReg).gas(1).done(),
  /* 214 */ instruction("MUL_UPPER_U_U", Arguments.ThreeReg).gas(1).done(),
  /* 215 */ instruction("MUL_UPPER_S_U", Arguments.ThreeReg).gas(1).done(),
  /* 216 */ instruction("SET_LT_U", Arguments.ThreeReg).gas(1).done(),
  /* 217 */ instruction("SET_LT_S", Arguments.ThreeReg).gas(1).done(),
  /* 218 */ instruction("CMOV_IZ", Arguments.ThreeReg).gas(1).done(),
  /* 219 */ instruction("CMOV_NZ", Arguments.ThreeReg).gas(1).done(),

  /* 220 */ instruction("ROT_L_64", Arguments.ThreeReg).gas(1).done(),
  /* 221 */ instruction("ROT_L_32", Arguments.ThreeReg).gas(1).done(),
  /* 222 */ instruction("ROT_R_64", Arguments.ThreeReg).gas(1).done(),
  /* 223 */ instruction("ROT_R_32", Arguments.ThreeReg).gas(1).done(),
  /* 224 */ instruction("AND_INV", Arguments.ThreeReg).gas(1).done(),
  /* 225 */ instruction("OR_INV", Arguments.ThreeReg).gas(1).done(),
  /* 226 */ instruction("XNOR", Arguments.ThreeReg).gas(1).done(),
  /* 227 */ instruction("MAX", Arguments.ThreeReg).gas(1).done(),
  /* 228 */ instruction("MAX_U", Arguments.ThreeReg).gas(1).done(),
  /* 229 */ instruction("MIN", Arguments.ThreeReg).gas(1).done(),

  /* 230 */ instruction("MIN_U", Arguments.ThreeReg).gas(1).done(),
];

class Builder {
  instruction: Instruction = new Instruction();

  name(n: string, args: Arguments): Builder {
    this.instruction.namePtr = changetype<usize>(n);
    this.instruction.kind = args;
    return this;
  }

  gas(g: Gas): Builder {
    this.instruction.gas = g;
    return this;
  }
  isTerminating(t: boolean): Builder {
    this.instruction.isTerminating = t;
    return this;
  }
  costMemory(): Builder {
    this.instruction.constantCost = MEMORY_COST;
    return this;
  }
  cost(constantCost: u32): Builder {
    this.instruction.constantCost = constantCost;
    return this;
  }
  regCost(b: u32): Builder {
    return this.regCostB(b, b);
  }
  regCostB(a: u32, b: u32): Builder {
    this.instruction.registerCostOverlap = a;
    this.instruction.registerCost = b;
    return this;
  }
  opsCost(a: u32, l: u32, s: u32, m: u32, d: u32): Builder {
    this.instruction.opsCost = OpsCost.alsmd(a, l, s, m, d);
    return this;
  }
  done(): Instruction {
    return this.instruction;
  }
}
