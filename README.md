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
