## Description

This project visualizes the Mandelbrot set using the TileLayer and BitmapLayer from Deck.gl, allowing you to explore it at different zoom levels. By creating a tiled rendering, users can efficiently zoom and pan through the visualization without rendering the entire image at once.

## Features

- High-Resolution Rendering: Visualize the Mandelbrot set in high detail.
- Interactive Exploration: Pan and zoom to explore various parts of the set.
- Color Gradients: Utilize different gradient functions and color schemes to personalize the visualization.
- Efficient Tiling: Only render the parts of the image that are in view, leading to a smoother user experience.
- Save images to a library to come back to later
- URLs contain the full state required to generate the image, meaning images can be shared via URL
- Export for print: render at paper presets up to 24×36" at 300 DPI, computed offscreen through the Rust/WASM worker pool
- Saved locations: name and save the full view state, with portable JSON export/import in the Library dialog
- Gallery: a plate-archive portfolio of saved locations at /gallery, each live-rendered

# Where can I use it?

https://mandelbrotset.xyz/ 

## Installation

Clone this repository:
`git clone https://github.com/patedwards/mandelbrotset.xyz.git`

`cd mandelbrotset-xyz/` 

Run `npm install`

## Usage 

1. From within mandelbrotset-xyz, run `npm start`
2. Open your browser and navigate to http://localhost:3000.
3. Explore the Mandelbrot set!

## Deploy

npm run build
firebase deploy

## Todos:

Search for the name e.g "TODO: bring-back-gradient-function" to find the part of code that might just be commented out to bring back

### Small:

Add other gradient functions to GL so they're fast as well

### Medium

zoom-to-infinity: this could be large if you do it with rust, but you can always just revert to doing the calcs on JS, they're faster than the bad rust implementation you have now - just need to make the maxIterations a little less aggressive and look for some other optimizations


### Large

Seamless deep zoom — three-phase plan (Patch brain: long/projects/mandelbrot.md):

0. Pipeline: per-tile iteration budget, priority + abort in the worker pool, preview layer, retire GL for interaction (Patch task #903).
1. **Done (2026-09-05, this branch):** perturbation + rebasing + BLA in `wasm-lib` (`reference.rs`, `perturb.rs`) and the crisp renderer (`crisp.rs`: smooth colouring, adaptive supersampling, distance-estimate filament shading). Verified against a fixed-point oracle at 2^-120 pixel spacing.
2. Floating-origin viewer: deck.gl's f64 view state can't hold the centre past ~z44 — keep a bigfloat anchor and render tiles as offsets from it (the Rust side already takes deltas).
3. GPU comeback: f32 shader over *rescaled* deltas against the same reference; only once it matches the WASM path pixel-for-pixel.
