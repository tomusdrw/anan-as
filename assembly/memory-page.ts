export type PageIndex = u32;
export type ArenaId = u32;

/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2dad002dad00?v=0.7.2 */
export const PAGE_SIZE: u32 = 4096;
export const PAGE_SIZE_SHIFT: u32 = 12;

/** https://graypaper.fluffylabs.dev/#/ab2cdbd/2daf002daf00?v=0.7.2 */
export const SEGMENT_SIZE: u32 = 2 ** 16;
export const SEGMENT_SIZE_SHIFT: u32 = 16;

/** https://graypaper.fluffylabs.dev/#/ab2cdbd/254401254a01?v=0.7.2 */
export const RESERVED_MEMORY: u32 = SEGMENT_SIZE;
export const RESERVED_PAGES: u32 = RESERVED_MEMORY / PAGE_SIZE;

/** Amount of memory to allocate eagerly */
export const ALLOCATE_EAGERLY: u32 = 2 ** 29; // 512MB

export enum Access {
  None = 0,
  Read = 1,
  Write = 2,
}

export class Page {
  constructor(
    public readonly access: Access,
    public readonly raw: RawPage,
  ) {}

  can(access: Access): boolean {
    return this.access === Access.Write || this.access === access;
  }
}

export class RawPage {
  constructor(
    public readonly id: ArenaId,
    public page: Uint8Array | null,
  ) {}

  get data(): Uint8Array {
    if (this.page === null) {
      this.page = new Uint8Array(PAGE_SIZE).fill(0);
    }
    return this.page as Uint8Array;
  }
}

export class Arena {
  private free: RawPage[];
  private readonly arenaBytes: u32;
  private extraPageIndex: ArenaId;

  constructor(pageCount: u32) {
    this.arenaBytes = PAGE_SIZE * pageCount;
    this.free = [];
    this.extraPageIndex = pageCount;
    const data = new ArrayBuffer(this.arenaBytes);
    for (let i = 0; i < <i32>pageCount; i++) {
      this.free.unshift(new RawPage(i, Uint8Array.wrap(data, i * PAGE_SIZE, PAGE_SIZE)));
    }
  }

  acquire(): RawPage {
    if (this.free.length > 0) {
      return this.free.pop();
    }
    // no pages!
    const allocatedMemory = this.extraPageIndex * PAGE_SIZE;
    // print warning only once
    if (allocatedMemory === this.arenaBytes) {
      console.log("Warning: Run out of pages! Allocating.");
    }

    // actually allocate for some time, but later do it lazily
    const data = allocatedMemory < ALLOCATE_EAGERLY ? new Uint8Array(PAGE_SIZE) : null;
    this.extraPageIndex += 1;
    return new RawPage(this.extraPageIndex, data);
  }

  release(page: RawPage): void {
    this.free.push(page);
  }
}
