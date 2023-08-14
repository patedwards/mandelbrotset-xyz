import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderer
} from "three";
import { makeMandelbrot } from "../utilities/tileGeneration";
import { fragmentShader, vertexShader } from "./gLshaders";
import { mandelbrotPixelTransform } from "./mandelbrotUtils";
import { convertDataToPixels, createTileImage } from "./webglUtils";

const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(256, 256);
const scene = new Scene();
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

export const createTileLayer = ({
  maxIterations,
  colors,
  gradientFunction,
  glIsUsed,
}) => {
  console.log("createTileLayer", colors);
  return !glIsUsed
    ? new TileLayer({
        minZoom: 0,
        maxZoom: Infinity,
        tileSize: 256,
        updateTriggers: {
          getTileData: { maxIterations, colors, gradientFunction, glIsUsed },
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
      })
    : new TileLayer({
        minZoom: 0,
        maxZoom: Infinity,
        tileSize: 256,
        updateTriggers: {
          getTileData: { maxIterations, colors, gradientFunction, glIsUsed },
        },
        async getTileData({ bbox: { west, east, south, north }, zoom }) {
          const [minX, maxX, minY, maxY] = [west, east, south, north];

          const geometry = new PlaneGeometry(2, 2);

          const material = new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
              maxIterations: { value: maxIterations },
              mandelbrotBounds: { value: [minX, maxX, minY, maxY] },
              colorA: { value: [colors.start.r/255, colors.start.g/255, colors.start.b/255] },
              colorB: { value: [colors.middle.r/255, colors.middle.g/255, colors.middle.b/255]},
              colorC: { value: [colors.end.r/255, colors.end.g/255, colors.end.b/255]},
            },
          });

          const mesh = new Mesh(geometry, material);
          scene.add(mesh);

          renderer.render(scene, camera);
          scene.remove(mesh);

          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const context = canvas.getContext("2d");
          context.drawImage(renderer.domElement, 0, 0);

          return canvas;
        },
        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
          } = props.tile;
          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north],
          });
        },
      });
};
