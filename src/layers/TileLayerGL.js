/* GPU tile renderer for shallow zoom.
 *
 * One shared offscreen WebGL canvas + one fragment shader (`gLshaders.js`)
 * handles every gradient, swapping a `gradientId` uniform per tile. Per-tile
 * cost is essentially the GPU rasterising one full-screen quad — orders of
 * magnitude faster than the Rust/WASM tile loop at the same zoom. Above the
 * GL precision threshold (~zoom 22) the WASM renderer takes over; both
 * produce visually identical pixels because the math is the same.
 *
 * Raw WebGL rather than three.js: we only need one shader, and dropping the
 * three dep is ~600 KB off the main bundle.
 */
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";

import {
  FRAGMENT_SHADER,
  GRADIENT_IDS,
  VERTEX_SHADER,
} from "../utilities/gLshaders";

const TILE_SIZE = 256;

// One WebGL canvas + program for the whole app. Lazily initialised on the
// first tile request so non-GL code paths don't pay for it.
let glCanvas = null;
let glCtx = null;
let glUniforms = null;

function compile(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`shader compile failed: ${log}`);
  }
  return sh;
}

function ensureGL() {
  if (glCtx) return glCtx;
  glCanvas = document.createElement("canvas");
  glCanvas.width = TILE_SIZE;
  glCanvas.height = TILE_SIZE;
  // antialias off (we sample per-pixel anyway); preserveDrawingBuffer left at
  // the default false — we snapshot via drawImage synchronously after every
  // draw, before the buffer can be cleared.
  const gl = glCanvas.getContext("webgl", { antialias: false, alpha: true });
  if (!gl) throw new Error("WebGL unavailable");

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`program link failed: ${gl.getProgramInfoLog(prog)}`);
  }
  gl.useProgram(prog);

  // Fullscreen quad in NDC.
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  const posLoc = gl.getAttribLocation(prog, "aPosition");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  gl.viewport(0, 0, TILE_SIZE, TILE_SIZE);

  glCtx = gl;
  glUniforms = {
    maxIterations: gl.getUniformLocation(prog, "maxIterations"),
    mandelbrotBounds: gl.getUniformLocation(prog, "mandelbrotBounds"),
    gradientId: gl.getUniformLocation(prog, "gradientId"),
    colorStart: gl.getUniformLocation(prog, "colorStart"),
    colorMiddle: gl.getUniformLocation(prog, "colorMiddle"),
    colorEnd: gl.getUniformLocation(prog, "colorEnd"),
    colorBlack: gl.getUniformLocation(prog, "colorBlack"),
  };
  return gl;
}

function renderGLTile({ west, east, south, north, maxIterations, gradientFunction, colors }) {
  const gl = ensureGL();
  const u = glUniforms;
  gl.uniform1f(u.maxIterations, maxIterations);
  gl.uniform4f(u.mandelbrotBounds, west, east, south, north);
  gl.uniform1i(u.gradientId, GRADIENT_IDS[gradientFunction] ?? 0);
  gl.uniform3f(u.colorStart, colors.start.r / 255, colors.start.g / 255, colors.start.b / 255);
  gl.uniform3f(u.colorMiddle, colors.middle.r / 255, colors.middle.g / 255, colors.middle.b / 255);
  gl.uniform3f(u.colorEnd, colors.end.r / 255, colors.end.g / 255, colors.end.b / 255);
  gl.uniform3f(u.colorBlack, colors.black.r / 255, colors.black.g / 255, colors.black.b / 255);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  // Snapshot the WebGL canvas to a fresh 2D canvas — the GL drawing buffer is
  // reused on the next draw and can be cleared by the browser between frames.
  const out = document.createElement("canvas");
  out.width = TILE_SIZE;
  out.height = TILE_SIZE;
  out.getContext("2d").drawImage(glCanvas, 0, 0);
  return out;
}

export const createTileLayer = ({ maxIterations, colors, gradientFunction, maxZoom }) => {
  return new TileLayer({
    id: "mandelbrot-gl",
    minZoom: 0,
    maxZoom,
    tileSize: TILE_SIZE,
    updateTriggers: {
      getTileData: { maxIterations, gradientFunction, colors },
    },
    getTileData: ({ bbox: { west, south, east, north } }) =>
      renderGLTile({ west, east, south, north, maxIterations, gradientFunction, colors }),
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
