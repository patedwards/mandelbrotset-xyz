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