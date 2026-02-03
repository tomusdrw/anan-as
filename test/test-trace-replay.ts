#!/usr/bin/env node

import * as assert from "node:assert";
import { fileURLToPath } from "node:url";
import { HasMetadata } from "../build/release.js";
import { replayTraceFile } from "../bin/trace-replay.js";

const fixture = fileURLToPath(new URL("./fixtures/io-trace-output.log", import.meta.url));

const summary = replayTraceFile(fixture, {
  hasMetadata: HasMetadata.Yes,
  verify: false,
});

assert.ok(summary.ecalliCount > 0, "Expected at least one ecalli entry");
assert.strictEqual(summary.termination.type, "HALT");
