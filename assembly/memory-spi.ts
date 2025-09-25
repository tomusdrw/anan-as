import { SEGMENT_SIZE } from "./memory-page";

/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2daf002daf00?v=0.7.2 */
export const DATA_LENGTH: u32 = 2 ** 24;
/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2d47022d4702?v=0.7.2 */
export const ARGS_SEGMENT_START: u32 = 2 ** 32 - SEGMENT_SIZE - DATA_LENGTH;
/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2d33022d3502?v=0.7.2 */
export const STACK_SEGMENT_END: u32 = 2 ** 32 - 2 * SEGMENT_SIZE - DATA_LENGTH;
