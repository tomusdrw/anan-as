import { u8SignExtend, u16SignExtend, u32SignExtend } from "./instructions/utils";
import {
  Access,
  Arena,
  PAGE_SIZE,
  PAGE_SIZE_SHIFT,
  Page,
  PageIndex,
  RawPage,
  RESERVED_MEMORY,
  RESERVED_PAGES,
} from "./memory-page";

// @unmanaged
export class MaybePageFault {
  isFault: boolean = false;
  isAccess: boolean = false;
  fault: u32 = 0;
}

const EMPTY_UINT8ARRAY = new Uint8Array(0);
const EMPTY_PAGE = new Page(Access.None, new RawPage(-1, null));

class Chunks {
  firstPageData: Uint8Array = EMPTY_UINT8ARRAY;
  firstPageOffset: u32 = 0;
  secondPageData: Uint8Array = EMPTY_UINT8ARRAY;
  secondPageEnd: u32 = 0;
}

class PageResult {
  page: Page = EMPTY_PAGE;
  relativeAddress: u32 = 0;
}

const MEMORY_SIZE = 0x1_0000_0000;

export class MemoryBuilder {
  private readonly pages: Map<PageIndex, Page> = new Map();
  private arena: Arena = new Arena(128);

  /** Allocates memory pages with given `access`, for given `address` and initialize with `zeroes` */
  setEmpty(access: Access, address: u32, len: u32): MemoryBuilder {
    const endAddress = address + len;
    for (let currentAddress = address; currentAddress < endAddress; currentAddress += PAGE_SIZE) {
      this.getOrCreatePageForAddress(access, currentAddress);
    }
    return this;
  }

  /** Allocates memory pages with given `access`, for given `address` and writes there `data` */
  setData(access: Access, address: u32, data: Uint8Array): MemoryBuilder {
    let currentAddress = address;
    let currentData = data;
    while (currentData.length > 0) {
      const page = this.getOrCreatePageForAddress(access, currentAddress);

      const relAddress = currentAddress % PAGE_SIZE;
      const spaceInPage = PAGE_SIZE - relAddress;
      const end = u32(currentData.length) < spaceInPage ? currentData.length : spaceInPage;
      page.raw.data.set(currentData.subarray(0, end), relAddress);

      // move to the next address to write
      currentAddress = currentAddress + end;
      currentData = currentData.subarray(end);
    }
    return this;
  }

  /** Returns memory page for given address (creates if not exists) */
  getOrCreatePageForAddress(access: Access, address: u32): Page {
    const pageIdx = u32(address >> PAGE_SIZE_SHIFT);
    if (pageIdx < RESERVED_PAGES) {
      throw new Error(`Attempting to allocate reserved page: ${pageIdx}`);
    }

    if (!this.pages.has(pageIdx)) {
      const page = this.arena.acquire();
      this.pages.set(pageIdx, new Page(access, page));
    }

    return this.pages.get(pageIdx);
  }

  build(sbrkAddress: u32 = RESERVED_MEMORY, maxHeapPointer: u32 = MEMORY_SIZE - 1): Memory {
    return new Memory(this.arena, this.pages, sbrkAddress, maxHeapPointer);
  }
}

export class Memory {
  private lastAllocatedPage: i32;
  private pageResult: PageResult = new PageResult();
  private chunksResult: Chunks = new Chunks();

  constructor(
    private readonly arena: Arena,
    public readonly pages: Map<PageIndex, Page> = new Map(),
    private sbrkAddress: u32 = 0,
    private maxHeapPointer: u32 = MEMORY_SIZE - 1,
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

  sbrk(faultRes: MaybePageFault, amount: u32): u64 {
    const freeMemoryStart = this.sbrkAddress;
    if (amount === 0) {
      faultRes.isFault = false;
      return freeMemoryStart;
    }

    const newSbrk = i64(this.sbrkAddress) + amount;
    if (newSbrk > this.maxHeapPointer) {
      faultRes.isFault = true;
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

  getU8(faultRes: MaybePageFault, address: u32): u64 {
    return u8(this.getBytesReversed(faultRes, Access.Read, address, 1));
  }

  getU16(faultRes: MaybePageFault, address: u32): u64 {
    return bswap<u16>(u16(this.getBytesReversed(faultRes, Access.Read, address, 2)));
  }

  getU32(faultRes: MaybePageFault, address: u32): u64 {
    return bswap<u32>(u32(this.getBytesReversed(faultRes, Access.Read, address, 4)));
  }

  getU64(faultRes: MaybePageFault, address: u32): u64 {
    return bswap<u64>(this.getBytesReversed(faultRes, Access.Read, address, 8));
  }

  getI8(faultRes: MaybePageFault, address: u32): u64 {
    return u8SignExtend(u8(this.getU8(faultRes, address)));
  }

  getI16(faultRes: MaybePageFault, address: u32): u64 {
    return u16SignExtend(u16(this.getU16(faultRes, address)));
  }

  getI32(faultRes: MaybePageFault, address: u32): u64 {
    return u32SignExtend(u32(this.getU32(faultRes, address)));
  }

  setU8(faultRes: MaybePageFault, address: u32, value: u8): void {
    this.setBytes(faultRes, address, value, 1);
  }

  setU16(faultRes: MaybePageFault, address: u32, value: u16): void {
    this.setBytes(faultRes, address, value, 2);
  }

  setU32(faultRes: MaybePageFault, address: u32, value: u32): void {
    this.setBytes(faultRes, address, value, 4);
  }

  setU64(faultRes: MaybePageFault, address: u32, value: u64): void {
    this.setBytes(faultRes, address, value, 8);
  }

  /**
   * DO NOT USE.
   *
   * @deprecated exposed temporarily for debugger/typeberry API.
   */
  getMemory(fault: MaybePageFault, address: u32, length: u32): Uint8Array | null {
    // first traverse memory and see if we don't page fault
    if (length > 0) {
      let nextAddress = address;
      const pagesToCheck = i32((u64(length) + u64(PAGE_SIZE - 1)) >> PAGE_SIZE_SHIFT);
      for (let page = 0; page < pagesToCheck; page++) {
        const pageData = this.pageResult;
        this.getPage(fault, pageData, Access.Read, nextAddress);
        if (fault.isFault) {
          return null;
        }
        nextAddress += PAGE_SIZE;
      }
    }

    // only after, actually allocate and read the bytes.
    const destination = new Uint8Array(length);
    this.bytesRead(fault, address, destination, 0);
    if (fault.isFault) {
      return null;
    }

    return destination;
  }

  bytesRead(faultRes: MaybePageFault, address: u32, destination: Uint8Array, destinationOffset: u32): void {
    let nextAddress = address;
    let destinationIndex = i32(destinationOffset);

    while (destinationIndex < destination.length) {
      const bytesLeft = destination.length - destinationIndex;
      const pageData = this.pageResult;
      this.getPage(faultRes, pageData, Access.Read, nextAddress);
      if (faultRes.isFault) {
        return;
      }
      const relAddress = pageData.relativeAddress;
      const bytesToRead = relAddress + bytesLeft < PAGE_SIZE ? bytesLeft : PAGE_SIZE - pageData.relativeAddress;
      // actually copy the bytes
      const pageEnd = relAddress + bytesToRead;
      const data = pageData.page.raw.data;
      for (let i = relAddress; i < pageEnd; i++) {
        destination[destinationIndex] = data[i];
        destinationIndex++;
      }
      // move the pointers
      nextAddress += bytesToRead;
    }

    return;
  }

  /** Write bytes from given `source` (with `sourceOffset`) at given `address`. */
  bytesWrite(faultRes: MaybePageFault, address: u32, source: Uint8Array, sourceOffset: u32): void {
    let nextAddress = address;
    let sourceIndex = i32(sourceOffset);

    while (sourceIndex < source.length) {
      const bytesLeft = source.length - sourceIndex;
      const pageData = this.pageResult;
      this.getPage(faultRes, pageData, Access.Write, nextAddress);
      if (faultRes.isFault) {
        return;
      }
      const relAddress = pageData.relativeAddress;
      const bytesToWrite = relAddress + bytesLeft < PAGE_SIZE ? bytesLeft : PAGE_SIZE - pageData.relativeAddress;
      // actually copy the bytes
      const pageEnd = relAddress + bytesToWrite;
      const data = pageData.page.raw.data;
      for (let i = relAddress; i < pageEnd; i++) {
        data[i] = source[sourceIndex];
        sourceIndex++;
      }
      // move the pointers
      nextAddress += bytesToWrite;
    }

    return;
  }

  private getPage(faultRes: MaybePageFault, pageData: PageResult, access: Access, address: u32): void {
    const pageIdx = u32(address >> PAGE_SIZE_SHIFT);
    const relAddress = address % PAGE_SIZE;
    const pageStart = pageIdx << PAGE_SIZE_SHIFT;

    if (!this.pages.has(pageIdx)) {
      fault(faultRes, pageStart);
      pageData.page = EMPTY_PAGE;
      pageData.relativeAddress = relAddress;
      return;
    }

    const page = this.pages.get(pageIdx);
    if (!page.can(access)) {
      fault(faultRes, pageStart);
      faultRes.isAccess = true;
      pageData.page = EMPTY_PAGE;
      pageData.relativeAddress = relAddress;
      return;
    }

    faultRes.isFault = false;
    pageData.page = page;
    pageData.relativeAddress = relAddress;
    return;
  }

  private getChunks(faultRes: MaybePageFault, chunks: Chunks, access: Access, address: u32, bytes: u8): void {
    /**
     * Accessing empty set of bytes is always valid.
     * https://graypaper.fluffylabs.dev/#/68eaa1f/24a80024a800?v=0.6.4
     */
    if (bytes === 0) {
      faultRes.isFault = false;
      chunks.firstPageData = EMPTY_UINT8ARRAY;
      chunks.firstPageOffset = 0;
      chunks.secondPageData = EMPTY_UINT8ARRAY;
      chunks.secondPageEnd = 0;
      return;
    }

    const pageData = this.pageResult;
    this.getPage(faultRes, pageData, access, address);
    if (faultRes.isFault) {
      return;
    }

    const page = pageData.page;
    const relativeAddress = pageData.relativeAddress;

    const endAddress = relativeAddress + u32(bytes);
    const needSecondPage = endAddress > PAGE_SIZE;

    // everything is on one page - easy case
    if (!needSecondPage) {
      chunks.firstPageData = page.raw.data;
      chunks.firstPageOffset = relativeAddress;
      return;
    }

    const secondPageIdx = u32((address + u32(bytes)) % MEMORY_SIZE) >> PAGE_SIZE_SHIFT;
    const secondPageStart = secondPageIdx << PAGE_SIZE_SHIFT;
    if (!this.pages.has(secondPageIdx)) {
      fault(faultRes, secondPageStart);
      return;
    }
    // fetch the second page and check access
    const secondPage = this.pages.get(secondPageIdx);
    if (!secondPage.can(access)) {
      fault(faultRes, secondPageStart);
      faultRes.isAccess = true;
      return;
    }

    chunks.firstPageData = page.raw.data;
    chunks.firstPageOffset = relativeAddress;
    chunks.secondPageData = secondPage.raw.data;
    chunks.secondPageEnd = relativeAddress + u32(bytes) - PAGE_SIZE;
    return;
  }

  /** Write some bytes to at most 2 pages. */
  private setBytes(faultRes: MaybePageFault, address: u32, value: u64, bytes: u8): void {
    const r = this.chunksResult;
    this.getChunks(faultRes, r, Access.Write, address, bytes);
    if (faultRes.isFault) {
      return;
    }

    let bytesLeft = value;
    // write to first page
    const firstPageEnd = Math.min(PAGE_SIZE, r.firstPageOffset + bytes);
    for (let i: u32 = r.firstPageOffset; i < firstPageEnd; i++) {
      r.firstPageData[i] = u8(bytesLeft);
      bytesLeft >>= 8;
    }
    // write rest to the second page
    for (let i: u32 = 0; i < r.secondPageEnd; i++) {
      r.secondPageData[i] = u8(bytesLeft);
      bytesLeft >>= 8;
    }
  }

  private getBytesReversed(faultRes: MaybePageFault, access: Access, address: u32, bytes: u8): u64 {
    this.getChunks(faultRes, this.chunksResult, access, address, bytes);
    if (faultRes.isFault) {
      return 0;
    }

    // result (bytes in reverse order)
    let r: u64 = 0;
    const firstPageEnd = Math.min(PAGE_SIZE, this.chunksResult.firstPageOffset + bytes);

    // read from first page
    for (let i: u32 = this.chunksResult.firstPageOffset; i < firstPageEnd; i++) {
      r = (r << 8) | this.chunksResult.firstPageData[i];
    }

    // read from the second page
    for (let i: u32 = 0; i < this.chunksResult.secondPageEnd; i++) {
      r = (r << 8) | this.chunksResult.secondPageData[i];
    }

    return r;
  }
}

function fault(r: MaybePageFault, address: u32): void {
  r.isFault = true;
  r.isAccess = false;
  r.fault = address;
}
