# 🍍 anan-as

Assembly Script implementation of the JAM PVM (32bit).

[Demo](https://todr.me/anan-as)

#### Todo

- [x] Memory
- [x] [JAM tests](https://github.com/w3f/jamtestvectors/pull/3) compatibility
- [x] 64-bit & new instructions ([GrayPaper v0.5.0](https://graypaper.fluffylabs.dev))
- [x] GP 0.5.4 compatibility (ZBB extensions)

### Why?

- [Pineaples](https://en.wikipedia.org/wiki/Ananas) are cool.
- [JAM](https://graypaper.com/) is promising.
- [PVM](https://github.com/paritytech/polkavm) is neat.


### Useful where?

- Potentially as an alternative implementation for [`typeberry`](https://github.com/fluffylabs).
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

```

### Raw Bindings

Raw bindings give you direct access to WebAssembly exports without the JavaScript wrapper layer. This is useful for instantiating multiple instances or when you need more control:

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

### Version Tags

When installing the package, you can choose between stable releases and bleeding-edge builds:

```bash
# Latest stable release
npm install @fluffylabs/anan-as

# Latest build from main branch (includes commit hash)
npm install @fluffylabs/anan-as@next
```

## Building

To download the dependencies:
```
$ npm ci
```

To build the WASM modules (in `./build/{release,debug}.wasm`):

```
$ npm build
```

To run the example in the browser at [http://localhost:3000](http://localhost:3000).

```
$ npm run web
```

To run JSON test vectors.

```
$ npm start ./path/to/tests/*.json
```
