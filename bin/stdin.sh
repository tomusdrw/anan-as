#!/bin/bash
SCRIPT_DIR="$(dirname "$(readlink -f "$BASH_SOURCE")")"
${SCRIPT_DIR}/test-w3f.js -
