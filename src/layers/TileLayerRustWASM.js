/* Rust/WASM tile layer.
 *
 * Unlike the original implementation (which crossed the JS↔WASM boundary once
 * per pixel and only produced grayscale), this asks Rust to compute the whole
 * tile — escape iteration *and* colour mapping — and hands back one finished
 * RGBA buffer. Work runs on the Web Worker pool; if workers aren't available we
 * fall back to calling the WASM module on the main thread.
 *
 * Used for: every gradient function at any zoom (so the non-`standard`
 * gradients are finally fast), and the `standard` gradient at deep zooms where
 * the WebGL shader's 32-bit floats break down. See `hooks/state.js`.
 */
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";
import init, { render_tile } from "wasm-lib";

import { getTilePool } from "../workers/tilePool";

const TILE_SIZE = 256;

// Lazily-initialised WASM instance for the main-thread fallback path.
let mainThreadReady = null;
function ensureMainThreadWasm() {
  if (!mainThreadReady) mainThreadReady = init().then(() => true);
  return mainThreadReady;
}

function clampByte(x) {
  return Math.max(0, Math.min(255, Math.round(x)));
}

// Pack the four UI colours into the 12-byte layout Rust expects.
function colorsToBytes(colors) {
  return new Uint8Array([
    clampByte(colors.start.r),
    clampByte(colors.start.g),
    clampByte(colors.start.b),
    clampByte(colors.middle.r),
    clampByte(colors.middle.g),
    clampByte(colors.middle.b),
    clampByte(colors.end.r),
    clampByte(colors.end.g),
    clampByte(colors.end.b),
    clampByte(colors.black.r),
    clampByte(colors.black.g),
    clampByte(colors.black.b),
  ]);
}

export const createTileLayer = ({
  maxIterations,
  colors,
  gradientFunction,
  maxZoom,
}) => {
  const colorBytes = colorsToBytes(colors);
  const pool = getTilePool();

  return new TileLayer({
    id: "mandelbrot-wasm",
    minZoom: 0,
    maxZoom,
    tileSize: TILE_SIZE,
    updateTriggers: {
      getTileData: { maxIterations, gradientFunction, colors },
    },
    getTileData: async ({ bbox: { west, south, east, north } }) => {
      let rgba;
      if (pool) {
        const res = await pool.render({
          west,
          south,
          east,
          north,
          tileSize: TILE_SIZE,
          maxIterations,
          gradientFunction,
          colors: colorBytes,
        });
        rgba = res.rgba;
      } else {
        await ensureMainThreadWasm();
        rgba = render_tile(
          west,
          south,
          east,
          north,
          TILE_SIZE,
          TILE_SIZE,
          maxIterations,
          gradientFunction,
          colorBytes
        );
      }
      return new ImageData(
        rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba.buffer || rgba),
        TILE_SIZE,
        TILE_SIZE
      );
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
