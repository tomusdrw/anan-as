import {decodeProgram, getAssembly} from "./program";


export function example(): string {
  const program: u8[] = [
    0, 0, 33, 4, 8, 1, 4, 9, 1, 5, 3, 0, 2, 119, 255, 7, 7, 12, 82, 138, 8, 152, 8, 82, 169, 5, 243, 82, 135, 4, 8, 4, 9,
    17, 19, 0, 73, 147, 82, 213, 0,
  ];

  const p = decodeProgram(program);

  console.log(p.toString());

  return getAssembly(p);
}
