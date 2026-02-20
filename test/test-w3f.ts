#!/usr/bin/env node

import * as pvm from "../build/release.js";
import { runW3fTests } from "./test-w3f-common.js";

runW3fTests(pvm);
