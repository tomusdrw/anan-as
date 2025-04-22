import { MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE, PAGE_SIZE_SHIFT, RESERVED_MEMORY, RESERVED_PAGES } from "./memory-page";
import { Assert, Test, test } from "./test";

export const TESTS: Test[] = [
  test("Show fail when accessing any of the initial 16 pages", () => {
    const mem = new MemoryBuilder().build();

    const a = mem.getI8(0);
    const b = mem.getU64(RESERVED_MEMORY - 1);

    const assert = new Assert();
    assert.isEqual(a.fault.isFault, true, "a.fault");
    assert.isEqual(a.fault.isAccess, false, "a.access");
    assert.isEqual(a.fault.fault, 0);
    assert.isEqual(b.fault.isFault, true, "b.fault");
    assert.isEqual(b.fault.isAccess, false, "b.access");
    assert.isEqual(b.fault.fault, 61440);
    return assert;
  }),
  test("Show fail on missing page or invalid access", () => {
    const builder = new MemoryBuilder();
    builder.setData(Access.Read, RESERVED_MEMORY, new Uint8Array(10));
    const mem = builder.build();

    const a = mem.getU64(RESERVED_MEMORY);
    const b = mem.getU8((RESERVED_PAGES + 1) << PAGE_SIZE_SHIFT);
    const c = mem.setU8(RESERVED_MEMORY, 12);
    const d = mem.getU8(RESERVED_MEMORY);

    const assert = new Assert();
    assert.isEqual(a.fault.isFault, false, "a.fault");
    assert.isEqual(a.fault.isAccess, false, "a.access");
    assert.isEqual(a.ok, 0);
    assert.isEqual(b.fault.isFault, true, "b.fault");
    assert.isEqual(b.fault.isAccess, false, "b.access");
    assert.isEqual(b.fault.fault, 69632);
    assert.isEqual(c.isFault, true, "c.fault");
    assert.isEqual(c.isAccess, true, "c.access");
    assert.isEqual(c.fault, 65536);
    assert.isEqual(d.ok, 0);
    return assert;
  }),
  test("should read and write across pages", () => {
    const builder = new MemoryBuilder();
    builder.setData(Access.Write, RESERVED_MEMORY, new Uint8Array(1));
    builder.setData(Access.Write, (RESERVED_PAGES + 1) << PAGE_SIZE_SHIFT, new Uint8Array(1));
    const mem = builder.build();

    const out = new Uint8Array(16);
    const data = new Uint8Array(out.length);
    data.set([0xde, 0xad, 0xbe, 0xef], 0);

    const a = mem.bytesWrite(RESERVED_MEMORY + PAGE_SIZE - 10, data);
    const b = mem.bytesRead(RESERVED_MEMORY + PAGE_SIZE - 9, out);
    const c = mem.bytesRead(RESERVED_MEMORY + PAGE_SIZE * 2, out);

    const assert = new Assert();
    assert.isEqual(a.isFault, false, "a.fault");
    assert.isEqual(a.isAccess, false, "a.access");
    assert.isEqual(a.fault, 0, "a.fault");
    assert.isEqual(b.isFault, false, "b.fault");
    assert.isEqual(b.isAccess, false, "b.access");
    assert.isEqual(b.fault, 0, "b.fault");
    assert.isEqual(c.isFault, true, "c.fault");
    assert.isEqual(c.isAccess, false, "c.access");
    assert.isEqual(out.toString(), "173,190,239,0,0,0,0,0,0,0,0,0,0,0,0,0");
    assert.isEqual(data.toString(), "222,173,190,239,0,0,0,0,0,0,0,0,0,0,0,0");
    return assert;
  }),
  test("should allow 0-bytes reads and writes everywhere", () => {
    const mem = new MemoryBuilder().setData(Access.Read, RESERVED_MEMORY, new Uint8Array(0)).build();

    const out = new Uint8Array(0);

    // reserved pages
    const a = mem.bytesRead(0, out);
    const b = mem.bytesWrite(0, out);

    // not allocated
    const c = mem.bytesRead(RESERVED_MEMORY + RESERVED_MEMORY, out);
    const d = mem.bytesRead(RESERVED_MEMORY + RESERVED_MEMORY, out);

    // readable page
    const e = mem.bytesWrite(RESERVED_MEMORY, out);

    const assert = new Assert();
    assert.isEqual(a.isFault, false, "a.fault");
    assert.isEqual(b.isFault, false, "b.fault");
    assert.isEqual(c.isFault, false, "c.fault");
    assert.isEqual(d.isFault, false, "d.fault");
    assert.isEqual(e.isFault, false, "e.fault");
    return assert;
  }),
];
