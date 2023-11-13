import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";

import { fragmentShader, vertexShader } from "../utilities/gLshaders";

const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(256, 256);
const scene = new Scene();
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

export const createTileLayer = ({
  maxIterations,
  colors,
  gradientFunction,
  maxZoom,
}) => {
  return new TileLayer({
    minZoom: 0,
    maxZoom: maxZoom,
    tileSize: 256,
    updateTriggers: {
      getTileData: { maxIterations, colors, gradientFunction },
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
          colorA: {
            value: [
              colors.start.r / 255,
              colors.start.g / 255,
              colors.start.b / 255,
            ],
          },
          colorB: {
            value: [
              colors.middle.r / 255,
              colors.middle.g / 255,
              colors.middle.b / 255,
            ],
          },
          colorC: {
            value: [colors.end.r / 255, colors.end.g / 255, colors.end.b / 255],
          },
          colorBlack: {
            value: [
              colors.black.r / 255,
              colors.black.g / 255,
              colors.black.b / 255,
            ],
          },
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
