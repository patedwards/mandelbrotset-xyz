## Description

This project visualizes the Mandelbrot set using the TileLayer and BitmapLayer from Deck.gl, allowing you to explore it at different zoom levels. By creating a tiled rendering, users can efficiently zoom and pan through the visualization without rendering the entire image at once.

## Features

- High-Resolution Rendering: Visualize the Mandelbrot set in high detail.
- Interactive Exploration: Pan and zoom to explore various parts of the set.
- Color Gradients: Utilize different gradient functions and color schemes to personalize the visualization.
- Efficient Tiling: Only render the parts of the image that are in view, leading to a smoother user experience.
- Save images to a library to come back to later
- URLs contain the full state required to generate the image, meaning images can be shared via URL

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

Rendering outside of GL: Beyond zoom 24, GL starts to run into numerical precision errors. So maxZoom is 23.8 rather than Infinity. Alternative is to use Rust via WASM. But theres's a bottleneck with passing data. Look into making the rust code more efficient, and some memory sharing strategies with Rust. 