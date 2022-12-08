import { BitmapLayer } from "@deck.gl/layers";
import { useState, useEffect } from "react";
import { makeMandelbrot } from "../utilities/tileGeneration";
import { TileLayer } from "@deck.gl/geo-layers";
import DeckGL from "@deck.gl/react";

const createTileLayer = ({ scale, maxIterations }) => {
  console.log("createTileLayer", scale, maxIterations);

  return new TileLayer({
    // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
    minZoom: 0,
    maxZoom: Infinity,
    tileSize: 256,
    updateTriggers: {
        getTileData: {scale, maxIterations}
      },
    getTileData: ({ x, y, z }) => {
      console.log("here", scale, maxIterations);
      const pixels = makeMandelbrot(x, y, z, scale, maxIterations);
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
};
const Map = ({ scale, maxIterations }) => {
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 0
  });

  const [layer, setLayer] = useState(createTileLayer({ scale, maxIterations }));

  useEffect(() => {
    console.log("Scale", scale);
    setLayer(createTileLayer({ scale, maxIterations }));
  }, [scale, maxIterations]);

  console.log(scale, maxIterations);

  return (
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
  );
};

export default Map;
