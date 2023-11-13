import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";

import { make_mandelbrot_flat as make_mandelbrot } from "wasm-lib";

import { mandelbrotPixelTransform } from "../utilities/mandelbrotUtils";
import { convertDataToPixels, createTileImage } from "../utilities/webglUtils";

function unflattenArray(flatArray, width, height) {
  const unflattened = [];
  for (let i = 0; i < height; i++) {
    const row = [];
    for (let j = 0; j < width; j++) {
      // Each element in the original array was a tuple of 3 values
      const index = (i * width + j) * 3;
      const tuple = [
        flatArray[index],
        flatArray[index + 1],
        flatArray[index + 2],
      ];
      row.push(tuple);
    }
    unflattened.push(row);
  }
  return unflattened;
}

const makeMandelbrotRust = (x, y, z, maxIterations) => {
  const flatData = make_mandelbrot(x, y, z, maxIterations);
  const width = 256;
  const height = 256;
  const startTime = performance.now(); // Start timing
  const data = unflattenArray(flatData, width, height);
  const endTime = performance.now(); // End timing
  // http://localhost:3000/?x=-0.06591245268902371&y=0.8391493518636882&z=14.059764180237806&maxIterations=60&colors=2C001E-E95420-FFFFFF-FF0000&gradientFunction=standard
  console.log(
    x,
    y,
    z,
    maxIterations,
    `makeMandelbrotJs execution time: ${endTime - startTime} ms`
  ); // Log execution time
  return data;
};

export const createTileLayer = ({
  maxIterations,
  colors,
  gradientFunction,
  glIsUsed,
  maxZoom,
}) => {
  return new TileLayer({
    minZoom: 0,
    maxZoom,
    tileSize: 256,
    parameters: {
      maxIterations,
      colors,
      gradientFunction,
      glIsUsed,
    },
    updateTriggers: {
      getTileData: { maxIterations, colors, gradientFunction, glIsUsed },
    },
    getTileData: ({ x, y, z }) => {
      const data = makeMandelbrotRust(x, y, z, maxIterations);

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
