# 🍍 anan-as

AssemblyScript implementation of the JAM PVM (64-bit).

Gray Paper compatibility:

- [x] 0.7.2

[Demo](https://todr.me/anan-as)

## Why?

- [Pineapples](https://en.wikipedia.org/wiki/Ananas) are cool.
- [JAM](https://graypaper.com/) is promising.
- [PVM](https://github.com/paritytech/polkavm) is neat.

## Useful where?

- Main PVM backend of [`typeberry`](https://github.com/fluffylabs) JAM client.
- To test out the [PVM debugger](https://pvm.fluffylabs.dev).

## Installation

```bash
npm install @fluffylabs/anan-as
```

## Usage

The package exports multiple builds to suit different use cases:

### ESM Bindings (Recommended)

ESM bindings provide a convenient JavaScript wrapper around the WebAssembly module:

```javascript
// Default import (optimized release build with ESM bindings)
import ananAs from '@fluffylabs/anan-as';

// Debug build (includes source maps and debug info)
import ananAs from '@fluffylabs/anan-as/debug';

// Explicit release build
import ananAs from '@fluffylabs/anan-as/release';

// Release build with minimal runtime (requires manually calling GC)
import ananAs from '@fluffylabs/anan-as/release-mini';
// make sure to call GC after multiple independent runs
ananAs.__collect();

// Release build with stub host functions (for standalone testing)
import ananAs from '@fluffylabs/anan-as/release-stub';

// Compiler module (for PVM bytecode compilation)
import ananAs from '@fluffylabs/anan-as/compiler';
```

### Inline Builds

Inline builds bundle the WASM binary directly into the JavaScript module (base64 encoded),
eliminating the need to fetch a separate `.wasm` file:

```javascript
import ananAs from '@fluffylabs/anan-as/debug-inline';
import ananAs from '@fluffylabs/anan-as/release-inline';
import ananAs from '@fluffylabs/anan-as/release-mini-inline';
import ananAs from '@fluffylabs/anan-as/release-stub-inline';
```

### Raw Bindings

Raw bindings give you direct access to WebAssembly exports
without the JavaScript wrapper layer.
This is useful for instantiating multiple instances or when you need more control:

```javascript
// Raw bindings
import { instantiate } from '@fluffylabs/anan-as/raw';
// Import WASM file URLs
import debugWasm from '@fluffylabs/anan-as/debug.wasm';
import releaseWasm from '@fluffylabs/anan-as/release.wasm';

// Use with your own loader
const module = await WebAssembly.instantiateStreaming(
  fetch(releaseWasm),
  imports
);
const ananAs = await instantiate(module);
```

## Version Tags

When installing the package, you can choose between stable releases
and bleeding-edge builds:

```bash
# Latest stable release
npm install @fluffylabs/anan-as

# Latest build from main branch (includes commit hash)
npm install @fluffylabs/anan-as@next
```

## Building

To download the dependencies:

```cmd
npm ci
```

To build the WASM modules (in `./build/{release,debug}.wasm`):

```cmd
npm run build
```

To run the example in the browser at [http://localhost:3000](http://localhost:3000).

```cmd
npm run web
```

To run tests:

```cmd
# Run AssemblyScript unit tests and trace replay tests
npm test

# Run W3F test vectors
npm run test:w3f

# Run gas cost tests
npm run test:gas-cost
```

## CLI Usage

The package includes a CLI tool for disassembling, running, and replaying PVM bytecode:

```bash
# Disassemble bytecode to assembly
npx @fluffylabs/anan-as disassemble [--spi] [--no-metadata] <file.(jam|pvm|spi|bin)>

# Run JAM programs
npx @fluffylabs/anan-as run [--spi] [--no-logs] [--no-metadata] [--pc <number>] [--gas <number>] <file.jam> [spi-args.bin or hex]

# Replay an ecalli trace
# Learn more: https://github.com/tomusdrw/JIPs/blob/td-jip6-ecalliloggin/JIP-6.md
npx @fluffylabs/anan-as replay-trace [--no-metadata] [--no-verify] [--no-logs] <trace.log>

# Show help
npx @fluffylabs/anan-as --help
npx @fluffylabs/anan-as disassemble --help
npx @fluffylabs/anan-as run --help
```

The `run` command executes PVM bytecode until it encounters a `halt` instruction or a host call.
The `replay-trace` command re-executes an ecalli trace, replaying recorded host call responses.

### Commands

- `disassemble`: Convert PVM bytecode to human-readable assembly
- `run`: Execute PVM bytecode and show results
- `replay-trace`: Re-execute an ecalli trace with recorded host call responses

### Flags

- `--spi`: Treat input as JAM SPI format instead of generic PVM
- `--no-metadata`: Input does not start with metadata
- `--no-logs`: Disable execution logs (run and replay-trace commands)
- `--no-verify`: Skip verification against trace data (replay-trace only)
- `--pc <number>`: Set initial program counter (default: 0)
- `--gas <number>`: Set initial gas amount (default: 10,000)
- `--help`, `-h`: Show help information

### Examples

```bash
# Disassemble a JAM file (includes metadata by default)
npx @fluffylabs/anan-as disassemble program.jam

# Disassemble without metadata
npx @fluffylabs/anan-as disassemble --no-metadata program.jam

# Disassemble SPI program
npx @fluffylabs/anan-as disassemble --spi program.spi

# Run a JAM program with logs (includes metadata by default)
npx @fluffylabs/anan-as run program.jam

# Run a JAM program without metadata
npx @fluffylabs/anan-as run --no-metadata program.jam

# Run a JAM program quietly
npx @fluffylabs/anan-as run --no-logs program.jam

# Run a JAM program with custom initial PC and gas
npx @fluffylabs/anan-as run --pc 100 --gas 10000 program.jam

# Run SPI program with arguments (file or hex)
npx @fluffylabs/anan-as run --spi program.spi args.bin
npx @fluffylabs/anan-as run --spi program.spi 0xdeadbeef

# Replay an ecalli trace
npx @fluffylabs/anan-as replay-trace trace.log

# Replay without verification
npx @fluffylabs/anan-as replay-trace --no-verify trace.log
```
