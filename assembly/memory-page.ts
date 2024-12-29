export type PageIndex = u32;
export type ArenaId = u32;

export const PAGE_SIZE: u32 = 4096;
export const PAGE_SIZE_SHIFT = 12;

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
    public readonly data: Uint8Array,
  ) {}
}

export class Arena {
  private readonly data: ArrayBuffer;
  private readonly free: RawPage[];
  private extraPageIndex: ArenaId;

  constructor(pageCount: u32) {
    const size = PAGE_SIZE * pageCount;
    this.data = new ArrayBuffer(size);
    this.free = [];
    this.extraPageIndex = pageCount;
    for (let i = 0; i < <i32>pageCount; i++) {
      this.free.unshift(new RawPage(i, Uint8Array.wrap(this.data, i * PAGE_SIZE, PAGE_SIZE)));
    }
  }

  acquire(): RawPage {
    if (this.free.length > 0) {
      return this.free.pop();
    }
    // no pages!
    console.log("Run out of pages! Allocating.");
    this.extraPageIndex += 1;
    return new RawPage(this.extraPageIndex, new Uint8Array(PAGE_SIZE).fill(0));
  }

  release(page: RawPage): void {
    this.free.push(page);
  }
}
