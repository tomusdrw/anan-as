#!/bin/bash
# Extract clean ecalli trace files from typeberry log output.
#
# Usage:
#   ./bench/extract-traces.sh <raw-log-file> [output-dir]
#
# The script filters lines containing ecalli trace data, strips logger prefixes,
# and splits them into individual trace files (one per "program" line).
#
# Example:
#   JAM_LOG=ecalli=trace npm start -- --pvm=ananas import /tmp/storage.bin 2>&1 | tee /tmp/ecalli-raw.log
#   ./bench/extract-traces.sh /tmp/ecalli-raw.log bench/traces

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <raw-log-file> [output-dir]"
  echo ""
  echo "Extracts individual ecalli trace files from a typeberry log."
  echo "Each trace (starting with 'program') becomes a separate file."
  exit 1
fi

INPUT="$1"
OUTPUT_DIR="${2:-bench/traces}"

if [ ! -f "$INPUT" ]; then
  echo "Error: Input file not found: $INPUT"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Remove old traces
rm -f "$OUTPUT_DIR"/trace-*.log

# Filter ecalli trace lines and extract payload.
# The parser in trace-parse.ts uses extractPayload() which finds the first match
# of known trace keywords. We replicate that here: keep only lines that contain
# trace keywords, and strip everything before the keyword.
TRACE_KEYWORDS='(program 0x|memwrite 0x|start pc=|ecalli=[0-9]|memread 0x|setreg r[0-9]|setgas <-|HALT pc=|OOG pc=|PANIC=)'

COUNT=0
CURRENT_FILE=""

while IFS= read -r line; do
  # Extract payload: find the trace keyword and keep from there
  payload=$(echo "$line" | grep -oE "${TRACE_KEYWORDS}.*" 2>/dev/null || true)
  if [ -z "$payload" ]; then
    continue
  fi

  # Start a new file on each "program" line
  if echo "$payload" | grep -qE '^program '; then
    COUNT=$((COUNT + 1))
    CURRENT_FILE=$(printf "%s/trace-%03d.log" "$OUTPUT_DIR" "$COUNT")
    echo "  Extracting trace #$COUNT -> $CURRENT_FILE"
  fi

  if [ -n "$CURRENT_FILE" ]; then
    echo "$payload" >> "$CURRENT_FILE"
  fi
done < "$INPUT"

if [ "$COUNT" -eq 0 ]; then
  echo "Warning: No ecalli traces found in $INPUT"
  echo "Make sure the log was captured with JAM_LOG=ecalli=trace"
  exit 1
fi

echo ""
echo "Extracted $COUNT trace file(s) to $OUTPUT_DIR/"
