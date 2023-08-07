import { BitmapLayer } from "@deck.gl/layers";
import { makeMandelbrot } from "../utilities/tileGeneration";
import { TileLayer } from "@deck.gl/geo-layers";
//import { getColor } from "../utilities/styling";
//import { gradientFunctions } from "../utilities/math";

const createTileImage = (width, height) => {
  // Create a canvas element
  const canvas = document.createElement("canvas");
  // Set the dimensions of the canvas
  canvas.width = width;
  canvas.height = height;

  // Get the 2D rendering context of the canvas
  const ctx = canvas.getContext("2d");

  // Create a new ImageData object
  const imageData = new ImageData(width, height);
  return { ctx, imageData };
};

const VGA_PALETTE = [
  // Here's a simple version of the VGA palette
  [0x00, 0x00, 0x00],
  [0x00, 0x00, 0xaa],
  [0x00, 0xaa, 0x00],
  [0x00, 0xaa, 0xaa],
  [0xaa, 0x00, 0x00],
  [0xaa, 0x00, 0xaa],
  [0xaa, 0x55, 0x00],
  [0xaa, 0xaa, 0xaa],
  [0x55, 0x55, 0x55],
  [0x55, 0x55, 0xff],
  [0x55, 0xff, 0x55],
  [0x55, 0xff, 0xff],
  [0xff, 0x55, 0x55],
  [0xff, 0x55, 0xff],
  [0xff, 0xff, 0x55],
  [0xff, 0xff, 0xff],
  // ... More colors can be added for full 256 palette
];

// Gradient functions
const gradientFunctions = {
  // Gradient functions that incorporate the getColor logic
  standard: (x, y, iterations, maxIterations, colors) => {
    if (iterations === -1) return [35, 44, 51] // Black for points inside the Mandelbrot set
    let value = iterations / maxIterations;
    return getColor(value, colors.start, colors.middle, colors.end);
  },

  niceGradient: (x, y, iterations, maxIterations, colors) => {
    if (iterations === -1) return [35, 44, 51] // Black for points inside the Mandelbrot set
    let value =
      (Math.sin((iterations / maxIterations) * Math.PI - Math.PI / 2) + 1) / 2;
    return getColor(value, colors.start, colors.middle, colors.end, 0, 1);
  },

  log: (x, y, iterations, maxIterations, colors) => {
    if (iterations === -1) return [35, 44, 51] // Black for points inside the Mandelbrot set
    let value = Math.log(iterations + 1) / Math.log(maxIterations + 1);
    return getColor(value, colors.start, colors.middle, colors.end, 0, 1);
  },

  pillarMaker: (x, y, iterations, maxIterations, colors) => {
    let value =
      1 - (iterations / maxIterations - Math.log2(Math.log2(x * x + y * y)));
    return getColor(value, colors.start, colors.middle, colors.end, 1, 3);
  },

  sqrt: (x, y, iterations, maxIterations, colors) => {
    if (iterations === -1) return [35, 44, 51] // Black for points inside the Mandelbrot set
    let value = Math.sqrt(iterations / maxIterations);
    return getColor(value, colors.start, colors.middle, colors.end, 0, 1);
  },

  exponential: (x, y, iterations, maxIterations, colors) => {
  if (iterations === -1) return [35, 44, 51] // Black for points inside the Mandelbrot set{
    let value = Math.pow(iterations / maxIterations, 2);
    return getColor(value, colors.start, colors.middle, colors.end);
  },
  randomPalette: (x, y, iterations, maxIterations) => {
    if (iterations === -1) return [0, 0, 0]; // Black for points inside the Mandelbrot set
    const paletteIndex = iterations % VGA_PALETTE.length;
    return VGA_PALETTE[paletteIndex];
  },
};

const mandelbrotPixelTransform = (
  x,
  y,
  iterations,
  maxIterations,
  gradientFunction,
  colors
) => {
  // Call the appropriate gradient function
  if (
    [
      "standard",
      "niceGradient",
      "log",
      "pillarMaker",
      "sqrt",
      "exponential",
    ].includes(gradientFunction)
  ) {
    // For gradient functions that need colors
    return gradientFunctions[gradientFunction](
      x,
      y,
      iterations,
      maxIterations,
      colors
    );
  } else {
    // For gradient functions that directly return colors
    return gradientFunctions[gradientFunction](x, y, iterations, maxIterations);
  }
};
// Helper function to interpolate between two values
const lerp = (start, end, t) => start * (1 - t) + end * t;

const getColor = (value, startColor, middleColor, endColor, minValue=0, maxValue=1) => {
    // Normalize the value to range [0, 1]
    value = (value - minValue) / (maxValue - minValue);
    
    let color1, color2;
    
    if (value < 0.5) {
      color1 = startColor;
      color2 = middleColor;
      value *= 2; // normalize the value for interpolation
    } else {
      color1 = middleColor;
      color2 = endColor;
      value = 2 * value - 1; // normalize the value for interpolation
    }
  
    let r = Math.round(lerp(color1.r, color2.r, value));
    let g = Math.round(lerp(color1.g, color2.g, value));
    let b = Math.round(lerp(color1.b, color2.b, value));
  
    return [r, g, b];
  };
  

const convertDataToPixels = (data, imageData, pixelTransform) => {
  // Set the pixel data of the ImageData object
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      const index = (i * data[i].length + j) * 4;
      const [x, y, iterations] = data[i][j];
      const pixel = pixelTransform(x, y, iterations);
      imageData.data[index + 0] = pixel[0]; // Red channel
      imageData.data[index + 1] = pixel[1]; // Green channel
      imageData.data[index + 2] = pixel[2]; // Blue channel
      imageData.data[index + 3] = 255; // Alpha channel
    }
  }
  return imageData;
};

export const createTileLayer = ({
  maxIterations,
  colors,
  gradientFunction,
}) => {
  return new TileLayer({
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
    minZoom: 0,
    maxZoom: Infinity,
    tileSize: 256,
    updateTriggers: {
      getTileData: { maxIterations, colors, gradientFunction },
    },
    getTileData: ({ x, y, z }) => {
      const data = makeMandelbrot(x, y, z, maxIterations);
      const { ctx, imageData } = createTileImage(256, 256);
      convertDataToPixels(data, imageData, (x, y, iterations) =>
        mandelbrotPixelTransform(
          x,
          y,
          iterations,
          maxIterations,
          gradientFunction,
          colors
        )
      );

      // Draw the image data on the canvas
      ctx.putImageData(imageData, 0, 0);

      return imageData;
    },

    renderSubLayers: (props) => {
      const {
        bbox: { west, south, east, north },
      } = props.tile;
      return new BitmapLayer(props, {
        // can maybe load the image from an array see https://loaders.gl/docs/specifications/category-image
        // this means API would return an array not an image
        //tintColor: (r, g, b) => [r/255, 0, 0, 0, 0, g/255, 0, 0, 0, 0, b/255, 0, 0, 0, 0, 1],
        data: null,
        image: props.data,
        bounds: [west, south, east, north],
      });
    },
  });
};
