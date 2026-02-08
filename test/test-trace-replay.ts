#!/usr/bin/env node

import * as assert from "node:assert";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { replayTraceFile } from "../bin/src/trace-replay.js";
import { HasMetadata } from "../build/release.js";

const fixture = fileURLToPath(new URL("./fixtures/io-trace-output.log", import.meta.url));

if (!existsSync(fixture)) {
  throw new Error(`fixture not found: ${fixture}`);
}

const summary = replayTraceFile(fixture, {
  logs: false,
  hasMetadata: HasMetadata.Yes,
  verify: true,
});

console.log(summary);

assert.ok(summary.ecalliCount > 0, "Expected at least one ecalli entry");
assert.strictEqual(summary.termination.type, "HALT");
assert.ok(summary.success, "Expected successful re-execution");
