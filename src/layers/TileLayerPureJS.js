import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";
import { makeMandelbrot as makeMandelbrotJs } from "../utilities/tileGeneration";

import { mandelbrotPixelTransform } from "../utilities/mandelbrotUtils";
import { convertDataToPixels, createTileImage } from "../utilities/webglUtils";

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
      const data = makeMandelbrotJs(x, y, z, maxIterations);

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
