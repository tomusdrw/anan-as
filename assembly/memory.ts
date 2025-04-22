import { u8SignExtend, u16SignExtend, u32SignExtend } from "./instructions/utils";
import {
  Access,
  Arena,
  PAGE_SIZE,
  PAGE_SIZE_SHIFT,
  Page,
  PageIndex,
  RESERVED_MEMORY,
  RESERVED_PAGES,
  RawPage,
} from "./memory-page";

// @unmanaged
export class MaybePageFault {
  isFault: boolean = false;
  isAccess: boolean = false;
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

class PageData {
  constructor(
    public readonly fault: MaybePageFault,
    public readonly page: Page,
    public readonly relativeAddress: u32,
  ) {}
}

const MEMORY_SIZE = 0x1_0000_0000;

const EMPTY_UINT8ARRAY = new Uint8Array(0);
const EMPTY_PAGE = new Page(Access.None, new RawPage(-1, null));

export class MemoryBuilder {
  private readonly pages: Map<PageIndex, Page> = new Map();
  private arena: Arena = new Arena(128);

  setData(access: Access, address: u32, data: Uint8Array): MemoryBuilder {
    let currentAddress = address;
    let currentData = data;
    while (currentData.length > 0) {
      const pageIdx = u32(currentAddress >> PAGE_SIZE_SHIFT);
      if (pageIdx < RESERVED_PAGES) {
        throw new Error(`Attempting to allocate reserved page: ${pageIdx}`);
      }

      if (!this.pages.has(pageIdx)) {
        const page = this.arena.acquire();
        this.pages.set(pageIdx, new Page(access, page));
      }

      const relAddress = currentAddress % PAGE_SIZE;
      const page = this.pages.get(pageIdx);

      const end = u32(currentData.length) < PAGE_SIZE ? currentData.length : PAGE_SIZE;
      page.raw.data.set(currentData.subarray(0, end), relAddress);

      // move to the next address to write
      currentAddress = currentAddress + end;
      currentData = currentData.subarray(end);
    }
    return this;
  }

  build(sbrkAddress: u32 = RESERVED_MEMORY): Memory {
    return new Memory(this.arena, this.pages, sbrkAddress);
  }
}

export class Memory {
  private lastAllocatedPage: i32;

  constructor(
    private readonly arena: Arena,
    public readonly pages: Map<PageIndex, Page> = new Map(),
    private sbrkAddress: u32 = 0,
  ) {
    const sbrkPage = u32(sbrkAddress >> PAGE_SIZE_SHIFT);
    if (sbrkPage < RESERVED_PAGES) {
      throw new Error("sbrk within reserved memory is not allowed!");
    }
    this.lastAllocatedPage = pages.has(sbrkPage) ? sbrkPage : sbrkPage - 1;
  }

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
      r.ok = u8SignExtend(res.bytes[0]);
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
      r.ok = u16SignExtend(l);
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

  bytesRead(address: u32, destination: Uint8Array): MaybePageFault {
    let nextAddress = address;
    let destinationIndex = 0;

    while (destinationIndex < destination.length) {
      const bytesLeft = destination.length - destinationIndex;
      const pageData = this.getPage(Access.Read, nextAddress);
      if (pageData.fault.isFault) {
        return pageData.fault;
      }
      const relAddress = pageData.relativeAddress;
      const bytesToRead = relAddress + bytesLeft < PAGE_SIZE ? bytesLeft : PAGE_SIZE - pageData.relativeAddress;
      // actually copy the bytes
      const source = pageData.page.raw.data.subarray(relAddress, relAddress + bytesToRead);
      destination.set(source, destinationIndex);
      // move the pointers
      destinationIndex += bytesToRead;
      nextAddress += bytesToRead;
    }

    return new MaybePageFault();
  }

  bytesWrite(address: u32, source: Uint8Array): MaybePageFault {
    let nextAddress = address;
    let sourceIndex = 0;

    while (sourceIndex < source.length) {
      const bytesLeft = source.length - sourceIndex;
      const pageData = this.getPage(Access.Write, nextAddress);
      if (pageData.fault.isFault) {
        return pageData.fault;
      }
      const relAddress = pageData.relativeAddress;
      const bytesToWrite = relAddress + bytesLeft < PAGE_SIZE ? bytesLeft : PAGE_SIZE - pageData.relativeAddress;
      // actually copy the bytes
      const sourceData = source.subarray(sourceIndex, sourceIndex + bytesToWrite);
      pageData.page.raw.data.set(sourceData, relAddress);
      // move the pointers
      sourceIndex += bytesToWrite;
      nextAddress += bytesToWrite;
    }

    return new MaybePageFault();
  }

  private getPage(access: Access, address: u32): PageData {
    const pageIdx = u32(address >> PAGE_SIZE_SHIFT);
    const relAddress = address % PAGE_SIZE;
    const pageStart = pageIdx << PAGE_SIZE_SHIFT;

    if (!this.pages.has(pageIdx)) {
      return new PageData(fault(pageStart), EMPTY_PAGE, relAddress);
    }

    const page = this.pages.get(pageIdx);
    if (!page.can(access)) {
      const f = fault(pageStart);
      f.isAccess = true;
      return new PageData(f, EMPTY_PAGE, relAddress);
    }

    return new PageData(new MaybePageFault(), page, relAddress);
  }

  private getChunks(access: Access, address: u32, bytes: u8): Chunks {
    /**
     * Accessing empty set of bytes is always valid.
     * https://graypaper.fluffylabs.dev/#/68eaa1f/24a80024a800?v=0.6.4
     */
    if (bytes === 0) {
      return new Chunks(new MaybePageFault());
    }

    const pageData = this.getPage(access, address);
    if (pageData.fault.isFault) {
      return new Chunks(pageData.fault);
    }

    const page = pageData.page;
    const relativeAddress = pageData.relativeAddress;

    const endAddress = relativeAddress + u32(bytes);
    const needSecondPage = endAddress > PAGE_SIZE;

    // everything is on one page - easy case
    if (!needSecondPage) {
      const first = page.raw.data.subarray(relativeAddress, endAddress);
      return new Chunks(new MaybePageFault(), first);
    }

    const secondPageIdx = u32((address + u32(bytes)) % MEMORY_SIZE) >> PAGE_SIZE_SHIFT;
    const secondPageStart = secondPageIdx << PAGE_SIZE_SHIFT;
    if (!this.pages.has(secondPageIdx)) {
      return new Chunks(fault(secondPageStart));
    }
    // fetch the second page and check access
    const secondPage = this.pages.get(secondPageIdx);
    if (!page.can(access)) {
      const f = fault(secondPageStart);
      f.isAccess = true;
      return new Chunks(f);
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

function fault(address: u32): MaybePageFault {
  const r = new MaybePageFault();
  r.isFault = true;
  r.fault = address;
  return r;
}
