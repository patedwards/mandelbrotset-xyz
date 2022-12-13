import { Deck } from "@deck.gl/core";
import { BitmapLayer } from "@deck.gl/layers";
import { makeMandelbrot } from "../utilities/tileGeneration";
import { TileLayer } from "@deck.gl/geo-layers";
import { getColor } from "../utilities/styling";
import { gradientFunctions } from "../utilities/math";
import { v4 as uuidv4 } from "uuid";

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

const mandelbrotPixelTransform = (
    x,
    y,
    iterations,
    maxIterations,
    gradientFunction,
    colors,
    scale
) => {
    let value =
        iterations === -1
            ? 0
            : gradientFunctions[gradientFunction](x, y, iterations, maxIterations) /
            scale;
    let pixel = getColor(value, colors.start, colors.middle, colors.end);
    return pixel;
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

export const captureImage = async (viewState, scale,
    maxIterations,
    colors,
    gradientFunction) => {

    const layer = createTileLayer({
        scale,
        maxIterations,
        colors,
        gradientFunction
    })

    console.log("viewState", viewState.viewState)
    const deck = new Deck({
        initialViewState: viewState.viewState, layers: [layer],
        onAfterRender: () => {
            console.log("here...")
            window.localStorage.setItem("screenshot", deck.canvas.toDataURL())
        }
    });

    const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))
    await sleep(1000)
}

export const createTileLayer = ({
    scale,
    maxIterations,
    colors,
    gradientFunction
}) => {
    return new TileLayer({
        // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
        minZoom: 0,
        maxZoom: Infinity,
        tileSize: 256,
        updateTriggers: {
            getTileData: { scale, maxIterations, colors, gradientFunction }
        },
        getTileData: ({ x, y, z }) => {
            const data = makeMandelbrot(
                x,
                y,
                z,
                scale,
                maxIterations,
                colors,
                gradientFunction
            );
            const { ctx, imageData } = createTileImage(256, 256);
            convertDataToPixels(data, imageData, (x, y, iterations) =>
                mandelbrotPixelTransform(
                    x,
                    y,
                    iterations,
                    maxIterations,
                    gradientFunction,
                    colors,
                    scale
                )
            );

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