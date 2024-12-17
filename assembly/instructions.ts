import { Arguments } from "./arguments";
import { Gas } from "./gas";

@unmanaged
export class Instruction {
  namePtr: usize = 0;
  kind: Arguments = Arguments.Zero;
  gas: Gas = 0;
  isTerminating: boolean = false;
}

function instruction(name: string, kind: Arguments, gas: Gas, isTerminating: boolean = false): Instruction {
  const i = new Instruction();
  i.namePtr = changetype<usize>(name);
  i.kind = kind;
  i.gas = gas;
  i.isTerminating = isTerminating;
  return i;
}

export const MISSING_INSTRUCTION = instruction("INVALID", Arguments.Zero, 1, false);

export const INSTRUCTIONS: Instruction[] = [
  // 0
  instruction("TRAP", Arguments.Zero, 1, true),
  instruction("FALLTHROUGH", Arguments.Zero, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 10
  instruction("ECALLI", Arguments.OneImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 20
  instruction("LOAD_IMM_64", Arguments.OneRegOneExtImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 30
  instruction("STORE_IMM_U8", Arguments.TwoImm, 1),
  instruction("STORE_IMM_U16", Arguments.TwoImm, 1),
  instruction("STORE_IMM_U32", Arguments.TwoImm, 1),
  instruction("STORE_IMM_U64", Arguments.TwoImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 40
  instruction("JUMP", Arguments.OneOff, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 50
  instruction("JUMP_IND", Arguments.OneRegOneImm, 1, true),
  instruction("LOAD_IMM", Arguments.OneRegOneImm, 1),
  instruction("LOAD_U8", Arguments.OneRegOneImm, 1),
  instruction("LOAD_I8", Arguments.OneRegOneImm, 1),
  instruction("LOAD_U16", Arguments.OneRegOneImm, 1),
  instruction("LOAD_I16", Arguments.OneRegOneImm, 1),
  instruction("LOAD_U32", Arguments.OneRegOneImm, 1),
  instruction("LOAD_I32", Arguments.OneRegOneImm, 1),
  instruction("LOAD_U64", Arguments.OneRegOneImm, 1),
  instruction("STORE_U8", Arguments.OneRegOneImm, 1),

  // 60
  instruction("STORE_U16", Arguments.OneRegOneImm, 1),
  instruction("STORE_U32", Arguments.OneRegOneImm, 1),
  instruction("STORE_U64", Arguments.OneRegOneImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 70
  instruction("STORE_IMM_IND_U8", Arguments.OneRegTwoImm, 1),
  instruction("STORE_IMM_IND_U16", Arguments.OneRegTwoImm, 1),
  instruction("STORE_IMM_IND_U32", Arguments.OneRegTwoImm, 1),
  instruction("STORE_IMM_IND_U64", Arguments.OneRegTwoImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 80
  instruction("LOAD_IMM_JUMP", Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_EQ_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_NE_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_LT_U_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_LE_U_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_GE_U_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_GT_U_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_LT_S_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_LE_S_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  instruction("BRANCH_GE_S_IMM", Arguments.OneRegOneImmOneOff, 1, true),

  // 90
  instruction("BRANCH_GT_S_IMM", Arguments.OneRegOneImmOneOff, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 100
  instruction("MOVE_REG", Arguments.TwoReg, 1),
  instruction("SBRK", Arguments.TwoReg, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 110
  instruction("STORE_IND_U8", Arguments.TwoRegOneImm, 1),
  instruction("STORE_IND_U16", Arguments.TwoRegOneImm, 1),
  instruction("STORE_IND_U32", Arguments.TwoRegOneImm, 1),
  instruction("STORE_IND_U64", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_IND_U8", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_IND_I8", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_IND_U16", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_IND_I16", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_IND_U32", Arguments.TwoRegOneImm, 1),
  instruction("LOAD_IND_I32", Arguments.TwoRegOneImm, 1),

  // 120
  instruction("LOAD_IND_U64", Arguments.TwoRegOneImm, 1),
  instruction("ADD_IMM_32", Arguments.TwoRegOneImm, 1),
  instruction("AND_IMM", Arguments.TwoRegOneImm, 1),
  instruction("XOR_IMM", Arguments.TwoRegOneImm, 1),
  instruction("OR_IMM", Arguments.TwoRegOneImm, 1),
  instruction("MUL_IMM_32", Arguments.TwoRegOneImm, 1),
  instruction("SET_LT_U_IMM", Arguments.TwoRegOneImm, 1),
  instruction("SET_LT_S_IMM", Arguments.TwoRegOneImm, 1),
  instruction("SHLO_L_IMM_32", Arguments.TwoRegOneImm, 1),
  instruction("SHLO_R_IMM_32", Arguments.TwoRegOneImm, 1),

  // 130
  instruction("SHAR_R_IMM_32", Arguments.TwoRegOneImm, 1),
  instruction("NEG_ADD_IMM_32", Arguments.TwoRegOneImm, 1),
  instruction("SET_GT_U_IMM", Arguments.TwoRegOneImm, 1),
  instruction("SET_GT_S_IMM", Arguments.TwoRegOneImm, 1),
  instruction("SHLO_L_IMM_ALT_32", Arguments.TwoRegOneImm, 1),
  instruction("SHLO_R_IMM_ALT_32", Arguments.TwoRegOneImm, 1),
  instruction("SHAR_R_IMM_ALT_32", Arguments.TwoRegOneImm, 1),
  instruction("CMOV_IZ_IMM", Arguments.TwoRegOneImm, 1),
  instruction("CMOV_NZ_IMM", Arguments.TwoRegOneImm, 1),
  instruction("ADD_IMM_64", Arguments.TwoRegOneImm, 1),

  // 140
  instruction("MUL_IMM_64", Arguments.TwoRegOneImm, 1),
  instruction("SHLO_L_IMM_64", Arguments.TwoRegOneImm, 1),
  instruction("SHLO_R_IMM_64", Arguments.TwoRegOneImm, 1),
  instruction("SHAR_R_IMM_64", Arguments.TwoRegOneImm, 1),
  instruction("NEG_ADD_IMM_64", Arguments.TwoRegOneImm, 1),
  instruction("SHLO_L_IMM_ALT_64", Arguments.TwoRegOneImm, 1),
  instruction("SHLO_R_IMM_ALT_64", Arguments.TwoRegOneImm, 1),
  instruction("SHAR_R_IMM_ALT_64", Arguments.TwoRegOneImm, 1),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 150
  instruction("BRANCH_EQ", Arguments.TwoRegOneOff, 1, true),
  instruction("BRANCH_NE", Arguments.TwoRegOneOff, 1, true),
  instruction("BRANCH_LT_U", Arguments.TwoRegOneOff, 1, true),
  instruction("BRANCH_LT_S", Arguments.TwoRegOneOff, 1, true),
  instruction("BRANCH_GE_U", Arguments.TwoRegOneOff, 1, true),
  instruction("BRANCH_GE_S", Arguments.TwoRegOneOff, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 160
  instruction("LOAD_IMM_JUMP_IND", Arguments.TwoRegTwoImm, 1, true),
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,
  MISSING_INSTRUCTION,

  // 170
  instruction("ADD_32", Arguments.ThreeReg, 1),
  instruction("SUB_32", Arguments.ThreeReg, 1),
  instruction("MUL_32", Arguments.ThreeReg, 1),
  instruction("DIV_U_32", Arguments.ThreeReg, 1),
  instruction("DIV_S_32", Arguments.ThreeReg, 1),
  instruction("REM_U_32", Arguments.ThreeReg, 1),
  instruction("REM_S_32", Arguments.ThreeReg, 1),
  instruction("SHLO_L_32", Arguments.ThreeReg, 1),
  instruction("SHLO_R_32", Arguments.ThreeReg, 1),
  instruction("SHAR_R_32", Arguments.ThreeReg, 1),

  // 180
  instruction("ADD_64", Arguments.ThreeReg, 1),
  instruction("SUB_64", Arguments.ThreeReg, 1),
  instruction("MUL_64", Arguments.ThreeReg, 1),
  instruction("DIV_U_64", Arguments.ThreeReg, 1),
  instruction("DIV_S_64", Arguments.ThreeReg, 1),
  instruction("REM_U_64", Arguments.ThreeReg, 1),
  instruction("REM_S_64", Arguments.ThreeReg, 1),
  instruction("SHLO_L_64", Arguments.ThreeReg, 1),
  instruction("SHLO_R_64", Arguments.ThreeReg, 1),
  instruction("SHAR_R_64", Arguments.ThreeReg, 1),

  // 190
  instruction("AND", Arguments.ThreeReg, 1),
  instruction("XOR", Arguments.ThreeReg, 1),
  instruction("OR", Arguments.ThreeReg, 1),
  instruction("MUL_UPPER_S_S", Arguments.ThreeReg, 1),
  instruction("MUL_UPPER_U_U", Arguments.ThreeReg, 1),
  instruction("MUL_UPPER_S_U", Arguments.ThreeReg, 1),
  instruction("SET_LT_U", Arguments.ThreeReg, 1),
  instruction("SET_LT_S", Arguments.ThreeReg, 1),
  instruction("CMOV_IZ", Arguments.ThreeReg, 1),
  instruction("CMOV_NZ", Arguments.ThreeReg, 1),
];
