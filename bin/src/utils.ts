export function hexEncode(result: number[], includePrefix = true) {
  const hex = result.map((x) => x.toString(16).padStart(2, "0")).join("");
  return includePrefix ? `0x${hex}` : hex;
}

export function hexDecode(data: string) {
  if (!data.startsWith("0x")) {
    throw new Error("hex input must start with 0x");
  }

  const hex = data.substring(2);
  const len = hex.length;
  if (len % 2 === 1) {
    throw new Error("Odd number of nibbles");
  }

  const bytes = new Uint8Array(len / 2);
  for (let i = 0; i < len; i += 2) {
    const c = hex.substring(i, i + 2);
    const byteIndex = i / 2;
    if (!/^[0-9a-fA-F]{2}$/.test(c)) {
      throw new Error(`hexDecode: invalid hex pair "${c}" in data "${data}" for bytes[${byteIndex}]`);
    }
    const value = parseInt(c, 16);
    bytes[byteIndex] = value;
  }

  return bytes;
}
