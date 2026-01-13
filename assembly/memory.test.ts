import { MaybePageFault, MemoryBuilder } from "./memory";
import { Access, PAGE_SIZE, PAGE_SIZE_SHIFT, RESERVED_MEMORY, RESERVED_PAGES } from "./memory-page";
import { Assert, Test, test } from "./test";

const MAX_MEMORY_INDEX: u32 = 0xffff_ffff;

export const TESTS: Test[] = [
  test("Show fail when accessing any of the initial 16 pages", () => {
    const aFault = new MaybePageFault();
    const bFault = new MaybePageFault();
    const mem = new MemoryBuilder().build();

    const a = mem.getI8(aFault, 0);
    const b = mem.getU64(bFault, RESERVED_MEMORY - 1);

    const assert = new Assert();
    assert.isEqual(aFault.isFault, true, "a.fault");
    assert.isEqual(aFault.isAccess, false, "a.access");
    assert.isEqual(aFault.fault, 0);
    assert.isEqual(bFault.isFault, true, "b.fault");
    assert.isEqual(bFault.isAccess, false, "b.access");
    assert.isEqual(bFault.fault, 61440);
    assert.isEqual(a, 0);
    assert.isEqual(b, 0);
    return assert;
  }),
  test("Show fail on missing page or invalid access", () => {
    const aFault = new MaybePageFault();
    const bFault = new MaybePageFault();
    const cFault = new MaybePageFault();
    const dFault = new MaybePageFault();

    const builder = new MemoryBuilder();
    builder.setData(Access.Read, RESERVED_MEMORY, new Uint8Array(10));
    const mem = builder.build();

    const a = mem.getU64(aFault, RESERVED_MEMORY);
    const b = mem.getU8(bFault, (RESERVED_PAGES + 1) << PAGE_SIZE_SHIFT);
    mem.setU8(cFault, RESERVED_MEMORY, 12);
    const d = mem.getU8(dFault, RESERVED_MEMORY);

    const assert = new Assert();
    assert.isEqual(aFault.isFault, false, "a.fault");
    assert.isEqual(aFault.isAccess, false, "a.access");
    assert.isEqual(a, 0);
    assert.isEqual(bFault.isFault, true, "b.fault");
    assert.isEqual(bFault.isAccess, false, "b.access");
    assert.isEqual(bFault.fault, 69632);
    assert.isEqual(b, 0);
    assert.isEqual(cFault.isFault, true, "c.fault");
    assert.isEqual(cFault.isAccess, true, "c.access");
    assert.isEqual(cFault.fault, 65536);
    assert.isEqual(d, 0);
    return assert;
  }),
  test("should read and write across pages", () => {
    const aFault = new MaybePageFault();
    const bFault = new MaybePageFault();
    const cFault = new MaybePageFault();
    const builder = new MemoryBuilder();
    builder.setData(Access.Write, RESERVED_MEMORY, new Uint8Array(1));
    builder.setData(Access.Write, (RESERVED_PAGES + 1) << PAGE_SIZE_SHIFT, new Uint8Array(1));
    const mem = builder.build();

    const out = new Uint8Array(16);
    const data = new Uint8Array(out.length);
    data.set([0xde, 0xad, 0xbe, 0xef], 0);

    mem.bytesWrite(aFault, RESERVED_MEMORY + PAGE_SIZE - 10, data, 0);
    mem.bytesRead(bFault, RESERVED_MEMORY + PAGE_SIZE - 9, out, 0);
    mem.bytesRead(cFault, RESERVED_MEMORY + PAGE_SIZE * 2, out, 0);

    const assert = new Assert();
    assert.isEqual(aFault.isFault, false, "a.fault");
    assert.isEqual(aFault.isAccess, false, "a.access");
    assert.isEqual(aFault.fault, 0, "a.fault");
    assert.isEqual(bFault.isFault, false, "b.fault");
    assert.isEqual(bFault.isAccess, false, "b.access");
    assert.isEqual(bFault.fault, 0, "b.fault");
    assert.isEqual(cFault.isFault, true, "c.fault");
    assert.isEqual(cFault.isAccess, false, "c.access");
    assert.isEqual(out.toString(), "173,190,239,0,0,0,0,0,0,0,0,0,0,0,0,0");
    assert.isEqual(data.toString(), "222,173,190,239,0,0,0,0,0,0,0,0,0,0,0,0");
    return assert;
  }),
  test("should allow 0-bytes reads and writes everywhere", () => {
    const a = new MaybePageFault();
    const b = new MaybePageFault();
    const c = new MaybePageFault();
    const d = new MaybePageFault();
    const e = new MaybePageFault();
    const mem = new MemoryBuilder().setData(Access.Read, RESERVED_MEMORY, new Uint8Array(0)).build();

    const out = new Uint8Array(0);

    // reserved pages
    mem.bytesRead(a, 0, out, 0);
    mem.bytesWrite(b, 0, out, 0);

    // not allocated
    mem.bytesRead(c, RESERVED_MEMORY + RESERVED_MEMORY, out, 0);
    mem.bytesRead(d, RESERVED_MEMORY + RESERVED_MEMORY, out, 0);

    // readable page
    mem.bytesWrite(e, RESERVED_MEMORY, out, 0);

    const assert = new Assert();
    assert.isEqual(a.isFault, false, "a.fault");
    assert.isEqual(b.isFault, false, "b.fault");
    assert.isEqual(c.isFault, false, "c.fault");
    assert.isEqual(d.isFault, false, "d.fault");
    assert.isEqual(e.isFault, false, "e.fault");
    return assert;
  }),
  test("should page fault when going beyond memory", (assert) => {
    const address = 2343629385;
    const length = 2145386496;

    const mem = new MemoryBuilder().setData(Access.Read, address, new Uint8Array(0)).build();
    const fault = new MaybePageFault();
    const res = mem.getMemory(fault, address, length);

    assert.isEqual(fault.isFault, true);
    assert.isEqual(res, null);

    return assert;
  }),
  test("should page fault when trying to allocate too much", (assert) => {
    const address = 16 * PAGE_SIZE;
    const length = 2145386496;

    const mem = new MemoryBuilder().setData(Access.Read, address, new Uint8Array(0)).build();
    const fault = new MaybePageFault();
    const res = mem.getMemory(fault, address, length);

    assert.isEqual(fault.isFault, true);
    assert.isEqual(res, null);

    return assert;
  }),
  test("should read memory succesfully", (assert) => {
    const address = 20 * PAGE_SIZE;
    const length = 1024;

    const mem = new MemoryBuilder().setData(Access.Read, address, new Uint8Array(4096)).build();
    const fault = new MaybePageFault();
    const res = mem.getMemory(fault, address, length);

    assert.isEqual(fault.fault, 0);
    assert.isEqual(fault.isFault, false);
    if (res !== null) {
      assert.isEqual(res.length, length);
    } else {
      assert.fail("Expected to read the memory successfully.");
    }

    return assert;
  }),
  test("sbrk should return current address when amount is 0", (assert) => {
    const sbrkStart: u32 = 0x20000;
    const mem = new MemoryBuilder().build(sbrkStart);
    const fault = new MaybePageFault();

    const result = mem.sbrk(fault, 0);

    assert.isEqual(fault.isFault, false, "should not fault");
    assert.isEqual(result, u64(sbrkStart), "should return current sbrk address");
    return assert;
  }),
  test("sbrk should allocate memory and return previous address", (assert) => {
    const sbrkStart: u32 = RESERVED_MEMORY;
    const mem = new MemoryBuilder().build(sbrkStart);
    const fault = new MaybePageFault();

    const first = mem.sbrk(fault, 1000);
    assert.isEqual(fault.isFault, false, "first sbrk should not fault");
    assert.isEqual(first, u64(sbrkStart), "first sbrk should return start");

    const second = mem.sbrk(fault, 500);
    assert.isEqual(fault.isFault, false, "second sbrk should not fault");
    assert.isEqual(second, u64(sbrkStart + 1000), "second sbrk should return incremented address");

    return assert;
  }),
  test("sbrk should fault when exceeding default maxHeapPointer (MEMORY_SIZE - 1)", (assert) => {
    const sbrkStart: u32 = u32(MAX_MEMORY_INDEX - 100);
    const mem = new MemoryBuilder().build(sbrkStart);
    const fault = new MaybePageFault();

    const result = mem.sbrk(fault, 200);

    assert.isEqual(fault.isFault, true, "should fault when exceeding memory limit");
    assert.isEqual(result, u64(sbrkStart), "should return current address on fault");
    return assert;
  }),
  test("sbrk should fault when exceeding custom maxHeapPointer", (assert) => {
    const sbrkStart: u32 = RESERVED_MEMORY;
    const maxHeap: u32 = sbrkStart + 1000;
    const mem = new MemoryBuilder().build(sbrkStart, maxHeap);
    const fault = new MaybePageFault();

    const first = mem.sbrk(fault, 500);
    assert.isEqual(fault.isFault, false, "first sbrk within limit should not fault");
    assert.isEqual(first, u64(sbrkStart), "first sbrk should return start");

    const second = mem.sbrk(fault, 600);
    assert.isEqual(fault.isFault, true, "sbrk exceeding maxHeapPointer should fault");
    assert.isEqual(second, u64(sbrkStart + 500), "should return current address on fault");

    return assert;
  }),
  test("sbrk should allow allocation up to maxHeapPointer boundary", (assert) => {
    const sbrkStart: u32 = RESERVED_MEMORY;
    const maxHeap: u32 = sbrkStart + 1000;
    const mem = new MemoryBuilder().build(sbrkStart, maxHeap);
    const fault = new MaybePageFault();

    const result = mem.sbrk(fault, 1000);
    assert.isEqual(fault.isFault, false, "sbrk up to maxHeapPointer should not fault");
    assert.isEqual(result, u64(sbrkStart), "should return start address");

    mem.sbrk(fault, 1);
    assert.isEqual(fault.isFault, true, "sbrk beyond maxHeapPointer should fault");

    return assert;
  }),
  test("sbrk maxHeapPointer prevents heap from growing into stack region", (assert) => {
    const heapStart: u32 = RESERVED_MEMORY;
    const stackStart: u32 = 0xfe000000;
    const mem = new MemoryBuilder().build(heapStart, stackStart);
    const fault = new MaybePageFault();
    const maxHeapSize: u32 = stackStart - heapStart;

    mem.sbrk(fault, maxHeapSize - 100);
    assert.isEqual(fault.isFault, false, "allocation within limit should succeed");

    mem.sbrk(fault, 200);
    assert.isEqual(fault.isFault, true, "allocation into stack region should fault");

    return assert;
  }),
];
