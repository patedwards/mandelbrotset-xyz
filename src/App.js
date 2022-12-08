import { useState, useEffect } from "react";
import DeckGL from "@deck.gl/react";
import { load } from "@loaders.gl/core";
import { BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import TextField from "@mui/material/TextField";
import Drawer from "@mui/material/Drawer";

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
  return [r * 255, g * 255, b * 255];
}

function evaluateMandelbrot(x0, y0, maxIterations) {
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
      let color = 1 - 0.01 * (iteration - Math.log2(Math.log2(x * x + y * y)));
      return color;
    }
  }
  // If failed, set color to black
  return 0;
}

function makeMandelbrot(x, y, zoom, scale, maxIterations) {
  // Calculate values to make navigation easier
  const zF = 2 ** zoom;
  const xFrom = x / zF;
  const xTo = (1 + x) / zF;
  const yFrom = y / zF;
  const yTo = (1 + y) / zF;
  const height = 256;
  const width = 256;

  const xs = (xTo - xFrom) / width;
  const ys = (yTo - yFrom) / height;

  const image = [];
  for (let j = 0; j < 256; j++) {
    let row = [];
    for (let i = 0; i < 256; i++) {
      let x0 = i * xs + xFrom;
      let y0 = j * ys + yFrom;
      let value = scale * evaluateMandelbrot(x0, y0, maxIterations);
      let pixel = generateColor(value);
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

  const [scale, setScale] = useState(1);
  const [maxIterations, setMaxIterations] = useState(100);

  const getScale = () => scale
  useEffect(() => {}, [scale, maxIterations])

  const SCALES = {
    0: 1,
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 1,
    7: 1,
    8: 1,
    9: 1,
    10: 1,
    11: 1,
    12: 1,
    13: 1,
    14: 1,
    15: 1,
    16: 1,
    17: 1,
    18: -1,
    19: -1,
    20: -1,
    21: -2,
    22: -2,
    23: -2,
    24: -2,
    25: -6,
    26: -6,
    27: -2,
    28: -2,
    29: -2,
    30: -2,
    31: -2,
    32: -2,
    33: -3,
    34: -3,
    35: -3,
    36: -3,
  }

  const layer = new TileLayer({
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
    minZoom: 0,
    maxZoom: Infinity,
    tileSize: 256,
    getTileData: ({ x, y, z }) => {
      const s = SCALES[z]
      const it = Math.min(100*(z), 2000)
      console.log(z, it, s)
      const pixels = makeMandelbrot(x, y, z, s, it);
      // Create a canvas element
      const canvas = document.createElement("canvas");
      // Set the dimensions of the canvas
      canvas.width = pixels[0].length;
      canvas.height = pixels.length;

      // Get the 2D rendering context of the canvas
      const ctx = canvas.getContext("2d");

      // Create a new ImageData object
      const imageData = new ImageData(pixels[0].length, pixels.length);

      // Set the pixel data of the ImageData object
      for (let i = 0; i < pixels.length; i++) {
        for (let j = 0; j < pixels[i].length; j++) {
          const index = (i * pixels[i].length + j) * 4;
          imageData.data[index + 0] = pixels[i][j][0]; // Red channel
          imageData.data[index + 1] = pixels[i][j][1]; // Green channel
          imageData.data[index + 2] = pixels[i][j][2]; // Blue channel
          imageData.data[index + 3] = 255; // Alpha channel
        }
      }

      // Draw the image data on the canvas
      ctx.putImageData(imageData, 0, 0);

      return imageData;
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
    <div>
      <Drawer anchor={"right"} open={true} variant="permanent">
      <TextField
        value={scale}
        onChange={event => setScale(event.target.value)}
      />
      <TextField
        value={maxIterations}
        onChange={event => setMaxIterations(event.target.value)}
      />
      </Drawer>
      <DeckGL
        controller={true}
        initialViewState={{
          longitude: 0,
          latitude: 0,
          zoom: 2,
          maxZoom: Infinity
        }}
        onViewStateChange={setViewState}
        layers={[layer]}
      />
    </div>
  );
}

export default App;
