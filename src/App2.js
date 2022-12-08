import { useState, useEffect } from "react";
import DeckGL from "@deck.gl/react";
import { load } from "@loaders.gl/core";
import { BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";

function generateColor(value) {
  // Make sure value is in range [0, 1]
  //value = Math.max(0, Math.min(1, value));
  // Map value to color using a spectral ramp
  let r, g, b;
  if (value < 0.25) {
    r = 0;
    g = 4 * value;
    b = 1;
  } else if (value < 0.5) {
    r = 0;
    g = 1;
    b = 1 - 4 * (value - 0.25);
  } else if (value < 0.75) {
    r = 4 * (value - 0.5);
    g = 1;
    b = 0;
  } else {
    r = 1;
    g = 1 - 4 * (value - 0.75);
    b = 0;
  }
  // Return color as hexadecimal string
  //return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  return [r, g, b];
}

function makeMandelbrot(x, y, zoom, maxIterations = 100) {
  // Calculate values to make navigation easier
  const zF = 2 ** zoom;
  const xWidth = 1;
  const yHeight = 1;
  const xFrom = x / zF;
  const xTo = (1 + x) / zF;
  const yFrom = y / zF;
  const yTo = (1 + y) / zF;
  const height = 256;
  const width = 256;
  const result = Array(height).fill(Array(width).fill(0));

  const xs = (xTo - xFrom) / width;
  const ys = (yTo - yFrom) / height;

  // For each pixel at (ix, iy)
  for (let iy = 0; iy < height; iy++) {
    for (let ix = 0; ix < width; ix++) {
      let x0 = ix * xs + xFrom;
      let y0 = iy * ys + yFrom;

      let x = 0.0;
      let y = 0.0;
      // Perform Mandelbrot set iterations
      for (let iteration = 0; iteration < maxIterations; iteration++) {
        let xNew = x * x - y * y + x0;
        y = 2 * x * y + y0;
        x = xNew;

        // If escaped
        if (x * x + y * y > 4.0) {
          // Color using pretty linear gradient
          let color =
            1 - 0.01 * (iteration - Math.log2(Math.log2(x * x + y * y)));
          result[iy][ix] = generateColor(color);
          break;
        }
      }
      // If failed, set color to black
      if (result[iy][ix] === 0) result[iy][ix] = generateColor(0);
    }
  }
  console.log("result", result);
  return result;
}

function createImage(x, y, z) {
  const image = [];

  for (let i = 0; i < 256; i++) {
    const row = [];
    for (let j = 0; j < 256; j++) {
      // Create a pixel with random color values
      const pixel = [1, Math.random(), Math.random()];
      row.push(pixel);
    }
    image.push(row);
  }
  return image;
}

function App() {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 0
  });

  const concat = (xs, ys) => xs.concat(ys);

  
  const layer = new TileLayer({
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
    minZoom: 0,
    maxZoom: Infinity,
    tileSize: 256,
    getTileData: ({x, y, z}) => {
      const image = makeMandelbrot(x, y, z).reduce(concat);
      const canvas = document.getElementById("canvas");
      const ctx = canvas.getContext("2d");

      // Create an ImageData object from the 2D array
      const imageData = ctx.createImageData(256, 256) ;

      // Set the color values of each pixel in the image
      for (let i = 0; i < image.length; i++) {
        let pixel = image[i];
        let [r, g, b] = pixel;
        let index = i * 4;

        // Set the red, green, blue, and alpha (opacity) values of the pixel
        imageData.data[index + 0] = r * 255;
        imageData.data[index + 1] = g * 255;
        imageData.data[index + 2] = b * 255;
        imageData.data[index + 3] = 255;
      }

      // Draw the image on the canvas
      ctx.putImageData(imageData, 0, 0);
      console.log(imageData)

      return imageData
    },

    renderSubLayers: props => {
      const {
        bbox: { west, south, east, north }
      } = props.tile;
      return new BitmapLayer(props, {
        // can maybe load the image from an array see https://loaders.gl/docs/specifications/category-image
        // this means API would return an array not an image
        //tintColor: (r, g, b) => [r/255, 0, 0, 0, 0, g/255, 0, 0, 0, 0, b/255, 0, 0, 0, 0, 1],
        data: null,
        image: props.data,
        bounds: [west, south, east, north]
      });
    }
  });
  return (
    <DeckGL
      controller={true}
      initialViewState={{
        longitude: 0,
        latitude: 0,
        zoom: 1,
        maxZoom: Infinity
      }}
      onViewStateChange={setViewState}
      layers={[layer]}
    />
  );
}

export default App;
