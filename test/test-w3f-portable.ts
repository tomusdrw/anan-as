#!/usr/bin/env node

// @ts-expect-error: portable bundle has no TS declarations for direct import
import * as pvm from "../dist/build/js/portable-bundle.js";
import { runW3fTests } from "./test-w3f-common.js";

runW3fTests(pvm);
