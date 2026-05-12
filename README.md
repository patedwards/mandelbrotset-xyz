## Description

This project visualizes the Mandelbrot set using the TileLayer and BitmapLayer from Deck.gl, allowing you to explore it at different zoom levels. By creating a tiled rendering, users can efficiently zoom and pan through the visualization without rendering the entire image at once.

Tiles are produced by one of two engines, chosen automatically:

- **WebGL** (a Three.js fragment shader) — used for the `standard` gradient at shallow zooms; very fast but its 32-bit floats lose accuracy past ~zoom 22.
- **Rust → WASM** (`wasm-lib/`, run on a pool of Web Workers) — used for every other gradient at any zoom, and for the `standard` gradient once WebGL gets imprecise. Each worker computes a whole RGBA tile (escape iteration + colour mapping) in Rust, so there's no per-pixel JS↔WASM traffic. A pure-JS path remains only as a fallback when WASM is unavailable.

## Features

- High-Resolution Rendering: Visualize the Mandelbrot set in high detail.
- Interactive Exploration: Pan and zoom to explore various parts of the set.
- Color Gradients: Different gradient functions and colour schemes; all of them render at native WASM speed.
- Efficient Tiling: Only the parts of the image in view are rendered.
- Save images to a library to come back to later.
- URLs contain the full state required to generate the image, so images can be shared via URL.

# Where can I use it?

https://mandelbrotset.xyz/

## Prerequisites

- Node.js 18+
- The Rust toolchain plus [`wasm-pack`](https://rustwasm.github.io/wasm-pack/installer/) and the `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`) — needed to (re)build `wasm-lib`. A prebuilt copy lives in `wasm-lib/pkg/` so `npm install` works without it.

## Installation

```
git clone https://github.com/patedwards/mandelbrotset-xyz.git
cd mandelbrotset-xyz
npm install
```

## Usage

1. `npm start`
2. Open http://localhost:3000.
3. Explore the Mandelbrot set!

To rebuild the WASM module after changing Rust code: `npm run build:wasm` (this also runs automatically as part of `npm run build`).

## Deploy

Hosted on [Cloudflare Pages](https://pages.cloudflare.com/) (free, no bandwidth cap). One-time setup: `npx wrangler login`, then create a Pages project named `mandelbrotset-xyz` (the first `wrangler pages deploy` will offer to). After that:

```
npm run deploy
```

which runs `npm run build` (rebuilds the WASM module, then the React app) and `wrangler pages deploy build`. `public/_redirects` and `public/_headers` configure the SPA fallback and cache headers; uncomment the COOP/COEP block in `_headers` if you ever switch the WASM renderer to SharedArrayBuffer threading.

## Roadmap

- **Deep zoom (perturbation theory):** an arbitrary-precision reference orbit (via `dashu`) plus a perturbation/rebasing engine and a custom high-precision viewer, for effectively unlimited zoom. In progress on the `rust-wasm-deepzoom` branch.
- **Performance:** hand-written `wasm32` SIMD inner loops, series approximation for deep zoom, a worker-pool tuned for visible-first tile ordering, and a dev HUD.
- **Build:** the project still uses `react-scripts` (CRA 5), which is the source of most `npm audit` noise; migrating to Vite is an open option.
