import * as branch from "./instructions/branch";
import * as jump from "./instructions/jump";
import * as load from "./instructions/load";
import * as logic from "./instructions/logic";
import * as math from "./instructions/math";
import * as mov from "./instructions/mov";
import * as set from "./instructions/set";
import * as store from "./instructions/store";

import { INVALID, ecalli, fallthrough, sbrk, trap } from "./instructions/misc";
import { InstructionRun } from "./instructions/outcome";

export const RUN: InstructionRun[] = [
  // 0
  trap,
  fallthrough,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 10
  ecalli,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 20
  load.load_imm_64,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 30
  store.store_imm_u8,
  store.store_imm_u16,
  store.store_imm_u32,
  store.store_imm_u64,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 40
  jump.jump,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 50
  jump.jump_ind,
  load.load_imm,
  load.load_u8,
  load.load_i8,
  load.load_u16,
  load.load_i16,
  load.load_u32,
  load.load_i32,
  load.load_u64,
  store.store_u8,

  // 60
  store.store_u16,
  store.store_u32,
  store.store_u64,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 70
  store.store_imm_ind_u8,
  store.store_imm_ind_u16,
  store.store_imm_ind_u32,
  store.store_imm_ind_u64,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 80
  jump.load_imm_jump,
  branch.branch_eq_imm,
  branch.branch_ne_imm,
  branch.branch_lt_u_imm,
  branch.branch_le_u_imm,
  branch.branch_ge_u_imm,
  branch.branch_gt_u_imm,
  branch.branch_lt_s_imm,
  branch.branch_le_s_imm,
  branch.branch_ge_s_imm,

  // 90
  branch.branch_gt_s_imm,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 100
  mov.move_reg,
  sbrk,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 110
  store.store_ind_u8,
  store.store_ind_u16,
  store.store_ind_u32,
  store.store_ind_u64,
  load.load_ind_u8,
  load.load_ind_i8,
  load.load_ind_u16,
  load.load_ind_i16,
  load.load_ind_u32,
  load.load_ind_i32,

  // 120
  load.load_ind_u64,
  math.add_imm_32,
  logic.and_imm,
  logic.xor_imm,
  logic.or_imm,
  math.mul_imm_32,
  set.set_lt_u_imm,
  set.set_lt_s_imm,
  logic.shlo_l_imm_32,
  logic.shlo_r_imm_32,

  // 130
  logic.shar_r_imm_32,
  math.neg_add_imm_32,
  set.set_gt_u_imm,
  set.set_gt_s_imm,
  logic.shlo_l_imm_alt_32,
  logic.shlo_r_imm_alt_32,
  logic.shar_r_imm_alt_32,
  mov.cmov_iz_imm,
  mov.cmov_nz_imm,
  math.add_imm,

  // 140
  math.mul_imm,
  logic.shlo_l_imm,
  logic.shlo_r_imm,
  logic.shar_r_imm,
  math.neg_add_imm,
  logic.shlo_l_imm_alt,
  logic.shlo_r_imm_alt,
  logic.shar_r_imm_alt,
  INVALID,
  INVALID,

  // 150
  branch.branch_eq,
  branch.branch_ne,
  branch.branch_lt_u,
  branch.branch_lt_s,
  branch.branch_ge_u,
  branch.branch_ge_s,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 160
  jump.load_imm_jump_ind,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,
  INVALID,

  // 170
  math.add_32,
  math.sub_32,
  math.mul_32,
  math.div_u_32,
  math.div_s_32,
  math.rem_u_32,
  math.rem_s_32,
  logic.shlo_l_32,
  logic.shlo_r_32,
  logic.shar_r_32,

  // 180
  math.add_64,
  math.sub,
  math.mul,
  math.div_u,
  math.div_s,
  math.rem_u,
  math.rem_s,
  logic.shlo_l,
  logic.shlo_r,
  logic.shar_r,

  // 190
  logic.and,
  logic.xor,
  logic.or,
  math.mul_upper_s_s,
  math.mul_upper_u_u,
  math.mul_upper_s_u,
  set.set_lt_u,
  set.set_lt_s,
  mov.cmov_iz,
  mov.cmov_nz,
];
