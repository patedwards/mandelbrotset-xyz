import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";

import { evaluate_mandelbrot_grayscale } from "wasm-lib";

import { mandelbrotPixelTransform } from "../utilities/mandelbrotUtils";
import { convertDataToPixels, createTileImage } from "../utilities/webglUtils";

export function makeMandelbrot(x, y, zoom, maxIterations) {
  const TILE_SIZE = 256;
  const height = TILE_SIZE;
  const width = TILE_SIZE;

  const lonFrom = tile2lon(x, zoom);
  const lonTo = tile2lon(x + 1, zoom);
  const latFrom = tile2lat(y + 1, zoom);
  const latTo = tile2lat(y, zoom);

  const lonStep = (lonTo - lonFrom) / width;
  const latStep = (latTo - latFrom) / height;

  const image = [];
  for (let j = 0; j < height; j++) {
    let row = [];
    for (let i = 0; i < width; i++) {
      let x0 = i * lonStep + lonFrom;
      let y0 = (height - 1 - j) * latStep + latFrom; // Inverting j here

      let g = evaluate_mandelbrot_grayscale(x0, y0, maxIterations);
      row.push([g, 0, 0]);
    }
    image.push(row);
  }

  return image;
}

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
    },
    updateTriggers: {
      getTileData: { maxIterations },
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

// Convert tile coordinate to longitude
function tile2lon(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

// Convert tile coordinate to latitude
function tile2lat(y, z) {
  let n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
