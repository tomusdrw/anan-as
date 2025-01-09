import { u32SignExtend } from "./math";
import { Access, Arena, PAGE_SIZE, PAGE_SIZE_SHIFT, Page, PageIndex } from "./memory-page";

// @unmanaged
export class MaybePageFault {
  isFault: boolean = false;
  fault: u32 = 0;
}

// @unmanaged
export class Result {
  ok: u64 = 0;
  fault: MaybePageFault = new MaybePageFault();
}

class Chunks {
  constructor(
    public readonly fault: MaybePageFault,
    public readonly first: Uint8Array = EMPTY_UINT8ARRAY,
    public readonly second: Uint8Array = EMPTY_UINT8ARRAY,
  ) {}
}

class ChunkBytes {
  constructor(
    public readonly fault: MaybePageFault,
    public readonly bytes: StaticArray<u8> = new StaticArray(0),
  ) {}
}

const MEMORY_SIZE = 0x1_0000_0000;

const EMPTY_UINT8ARRAY = new Uint8Array(0);

export class MemoryBuilder {
  private readonly pages: Map<PageIndex, Page> = new Map();
  private arena: Arena = new Arena(128);

  setData(access: Access, address: u32, data: Uint8Array): void {
    const pageIdx = u32(address >> PAGE_SIZE_SHIFT);
    if (!this.pages.has(pageIdx)) {
      const page = this.arena.acquire();
      this.pages.set(pageIdx, new Page(access, page));
    }

    const relAddress = address % PAGE_SIZE;
    const page = this.pages.get(pageIdx);
    page.raw.data.set(data, relAddress);

    if (relAddress + data.length > <u32>PAGE_SIZE) {
      throw new Error("Unable to write data in builder. Exceeds the page!");
    }
  }

  build(sbrkAddress: u32): Memory {
    return new Memory(this.arena, this.pages, sbrkAddress);
  }
}

export class Memory {
  constructor(
    private readonly arena: Arena,
    public readonly pages: Map<PageIndex, Page> = new Map(),
    private sbrkAddress: u32 = 0,
    private lastAllocatedPage: i32 = -1,
  ) {}

  pageDump(index: PageIndex): Uint8Array | null {
    if (!this.pages.has(index)) {
      return null;
    }
    return this.pages.get(index).raw.data;
  }

  free(): void {
    const pages = this.pages.values();
    for (let i = 0; i < pages.length; i++) {
      this.arena.release(pages[i].raw);
    }
    this.pages.clear();
  }

  sbrk(amount: u32): Result {
    const freeMemoryStart = new Result();
    freeMemoryStart.ok = this.sbrkAddress;
    if (amount === 0) {
      return freeMemoryStart;
    }

    const newSbrk = i64(this.sbrkAddress) + amount;
    if (newSbrk >= MEMORY_SIZE) {
      freeMemoryStart.fault.isFault = true;
      return freeMemoryStart;
    }
    this.sbrkAddress = u32(newSbrk);

    const pageIdx = i32((newSbrk - 1) >> PAGE_SIZE_SHIFT);
    if (pageIdx === this.lastAllocatedPage) {
      return freeMemoryStart;
    }

    for (let i = this.lastAllocatedPage + 1; i <= pageIdx; i++) {
      const page = this.arena.acquire();
      this.pages.set(i, new Page(Access.Write, page));
    }

    this.lastAllocatedPage = pageIdx;
    return freeMemoryStart;
  }

  getU8(address: u32): Result {
    const res = this.getBytes(Access.Read, address, 1);
    const r = new Result();
    r.fault = res.fault;
    if (!res.fault.isFault) {
      r.ok = res.bytes[0];
    }
    return r;
  }

  getU16(address: u32): Result {
    const res = this.getBytes(Access.Read, address, 2);
    const r = new Result();
    r.fault = res.fault;
    if (!res.fault.isFault) {
      r.ok = res.bytes[0];
      r.ok |= (<u32>res.bytes[1]) << 8;
    }
    return r;
  }

  getU32(address: u32): Result {
    const res = this.getBytes(Access.Read, address, 4);
    const r = new Result();
    r.fault = res.fault;
    if (!res.fault.isFault) {
      r.ok = res.bytes[0];
      r.ok |= (<u32>res.bytes[1]) << 8;
      r.ok |= (<u32>res.bytes[2]) << 16;
      r.ok |= (<u32>res.bytes[3]) << 24;
    }
    return r;
  }

  getU64(address: u32): Result {
    const res = this.getBytes(Access.Read, address, 8);
    const r = new Result();
    r.fault = res.fault;
    if (!res.fault.isFault) {
      r.ok = res.bytes[0];
      r.ok |= (<u64>res.bytes[1]) << 8;
      r.ok |= (<u64>res.bytes[2]) << 16;
      r.ok |= (<u64>res.bytes[3]) << 24;
      r.ok |= u64(res.bytes[4]) << 32;
      r.ok |= u64(res.bytes[5]) << 40;
      r.ok |= u64(res.bytes[6]) << 48;
      r.ok |= u64(res.bytes[7]) << 56;
    }
    return r;
  }

  getI8(address: u32): Result {
    const res = this.getBytes(Access.Read, address, 1);
    const r = new Result();
    r.fault = res.fault;
    if (!res.fault.isFault) {
      r.ok = u32SignExtend(i32(i16(i8(res.bytes[0]))));
    }
    return r;
  }

  getI16(address: u32): Result {
    const res = this.getBytes(Access.Read, address, 2);
    const r = new Result();
    r.fault = res.fault;
    if (!res.fault.isFault) {
      let l = u16(res.bytes[0]);
      l |= u16(res.bytes[1]) << 8;
      r.ok = u32SignExtend(i32(i16(l)));
    }
    return r;
  }

  getI32(address: u32): Result {
    const res = this.getBytes(Access.Read, address, 4);
    const r = new Result();
    r.fault = res.fault;
    if (!res.fault.isFault) {
      let l = u32(res.bytes[0]);
      l |= u32(res.bytes[1]) << 8;
      l |= u32(res.bytes[2]) << 16;
      l |= u32(res.bytes[3]) << 24;
      r.ok = u32SignExtend(l);
    }
    return r;
  }

  setU8(address: u32, value: u8): MaybePageFault {
    const res = this.getChunks(Access.Write, address, 1);
    if (res.fault.isFault) {
      return res.fault;
    }
    res.first[0] = value;
    return res.fault;
  }

  setU16(address: u32, value: u16): MaybePageFault {
    const res = this.getChunks(Access.Write, address, 2);
    if (res.fault.isFault) {
      return res.fault;
    }
    res.first[0] = value & 0xff;
    if (res.first.length > 1) {
      res.first[1] = value >> 8;
    } else {
      res.second[0] = value >> 8;
    }
    return res.fault;
  }

  setU32(address: u32, value: u32): MaybePageFault {
    const res = this.getChunks(Access.Write, address, 4);
    if (res.fault.isFault) {
      return res.fault;
    }

    let v = value;
    const len = res.first.length;

    for (let i = 0; i < len; i++) {
      res.first[i] = v & 0xff;
      v = v >> 8;
    }

    for (let i = 0; i < res.second.length; i++) {
      res.second[i] = v & 0xff;
      v = v >> 8;
    }

    return res.fault;
  }

  setU64(address: u32, value: u64): MaybePageFault {
    const res = this.getChunks(Access.Write, address, 8);
    if (res.fault.isFault) {
      return res.fault;
    }

    let v = value;
    const len = res.first.length;

    for (let i = 0; i < len; i++) {
      res.first[i] = u8(v);
      v = v >> 8;
    }

    for (let i = 0; i < res.second.length; i++) {
      res.second[i] = u8(v);
      v = v >> 8;
    }

    return res.fault;
  }

  private getChunks(access: Access, address: u32, bytes: u8): Chunks {
    const pageIdx = u32(address >> PAGE_SIZE_SHIFT);

    if (!this.pages.has(pageIdx)) {
      return fault(address);
    }

    const page = this.pages.get(pageIdx);
    if (!page.can(access)) {
      return fault(address);
    }

    const relativeAddress = address % PAGE_SIZE;
    const endAddress = relativeAddress + u32(bytes);
    const needSecondPage = endAddress > PAGE_SIZE;

    // everything is on one page - easy case
    if (!needSecondPage) {
      const first = page.raw.data.subarray(relativeAddress, endAddress);
      return new Chunks(new MaybePageFault(), first);
    }

    const secondPageIdx = u32((address + u32(bytes)) % MEMORY_SIZE) >> PAGE_SIZE_SHIFT;
    if (!this.pages.has(secondPageIdx)) {
      return fault(address);
    }
    // fetch the second page and check access
    const secondPage = this.pages.get(secondPageIdx);
    if (!page.can(access)) {
      return fault(address);
    }

    const firstChunk = page.raw.data.subarray(relativeAddress);
    const secondChunk = secondPage.raw.data.subarray(0, relativeAddress + u32(bytes) - PAGE_SIZE);
    return new Chunks(new MaybePageFault(), firstChunk, secondChunk);
  }

  private getBytes(access: Access, address: u32, bytes: u8): ChunkBytes {
    const res = this.getChunks(access, address, bytes);
    if (res.fault.isFault) {
      return new ChunkBytes(res.fault);
    }
    const data = getBytes(bytes, res.first, res.second);
    return new ChunkBytes(res.fault, data);
  }
}

function getBytes(bytes: u8, first: Uint8Array, second: Uint8Array): StaticArray<u8> {
  const res = new StaticArray<u8>(bytes);
  const len = first.length;
  for (let i = 0; i < len; i++) {
    res[i] = first[i];
  }
  for (let i = 0; i < second.length; i++) {
    res[len + i] = second[i];
  }
  return res;
}

function fault(address: u32): Chunks {
  const r = new MaybePageFault();
  r.isFault = true;
  r.fault = address;
  return new Chunks(r);
}
