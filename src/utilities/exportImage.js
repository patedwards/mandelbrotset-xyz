/* Offscreen, print-resolution export of the current view.
 *
 * Renders the viewport at an arbitrary pixel size by chunking it into square
 * jobs for the Rust/WASM worker pool (the same `render_tile` used for live
 * tiles), then stitching the RGBA buffers into one canvas. Nothing here touches
 * the on-screen deck.gl canvas, so exports can be far larger than the window.
 */

import { getTilePool } from "../workers/tilePool";
import { colorsToBytes } from "./colors";

const CHUNK = 512; // px per worker job — big enough to amortize, small enough to parallelize

/** Degrees ("complex units") per CSS pixel at a deck.gl zoom level. */
export const degreesPerPixel = (zoom) => 360 / (512 * Math.pow(2, zoom));

/** Common print presets. Sizes in inches, portrait orientation. */
export const PAPER_PRESETS = [
  { id: "screen", label: "Screen (wallpaper)", w: null, h: null },
  { id: "4x6", label: '4×6"', w: 4, h: 6 },
  { id: "8x10", label: '8×10"', w: 8, h: 10 },
  { id: "a4", label: "A4", w: 8.27, h: 11.69 },
  { id: "a3", label: "A3", w: 11.69, h: 16.54 },
  { id: "12x18", label: '12×18"', w: 12, h: 18 },
  { id: "18x24", label: '18×24"', w: 18, h: 24 },
  { id: "24x36", label: '24×36"', w: 24, h: 36 },
];

export const DPI_OPTIONS = [150, 300];

/** Largest square canvas this browser will actually rasterize. Cached. */
let maxCanvasSide;
export function getMaxCanvasSide() {
  if (maxCanvasSide) return maxCanvasSide;
  // Probe common limits from largest down (Chrome/Firefox 16384, Safari less).
  for (const side of [16384, 10836, 8192, 4096]) {
    try {
      const c = document.createElement("canvas");
      c.width = side;
      c.height = side;
      const ctx = c.getContext("2d");
      ctx.fillRect(side - 1, side - 1, 1, 1);
      if (ctx.getImageData(side - 1, side - 1, 1, 1).data[3] > 0) {
        maxCanvasSide = side;
        return side;
      }
    } catch (e) {
      /* try next */
    }
  }
  maxCanvasSide = 4096;
  return maxCanvasSide;
}

/**
 * Compute the complex-plane bbox for an export.
 *
 * The export keeps the current center and visual scale: whatever spans the
 * screen's height spans the export's height (so the print looks like what's on
 * screen, extended/cropped horizontally to the paper's aspect ratio).
 */
export function exportBbox({ x, y, z, widthPx, heightPx, screenHeightPx }) {
  const dppScreen = degreesPerPixel(z);
  const heightDeg = (screenHeightPx || window.innerHeight) * dppScreen;
  const widthDeg = heightDeg * (widthPx / heightPx);
  return {
    west: x - widthDeg / 2,
    east: x + widthDeg / 2,
    south: y - heightDeg / 2,
    north: y + heightDeg / 2,
  };
}

/**
 * Render the export. Returns a PNG Blob.
 *
 * onProgress(done, total) is called after each chunk lands.
 * Throws if WebAssembly workers are unavailable or the canvas is too large.
 */
export async function renderExport({
  x,
  y,
  z,
  widthPx,
  heightPx,
  maxIterations,
  gradientFunction,
  colors,
  screenHeightPx,
  onProgress,
  signal,
}) {
  const side = getMaxCanvasSide();
  if (widthPx > side || heightPx > side) {
    throw new Error(
      `This browser caps images at ${side}px per side — pick a smaller size or lower DPI.`
    );
  }

  const pool = getTilePool();
  if (!pool) {
    throw new Error(
      "High-resolution export needs WebAssembly workers, which this browser doesn't support."
    );
  }

  const bbox = exportBbox({ x, y, z, widthPx, heightPx, screenHeightPx });
  const degPerPxX = (bbox.east - bbox.west) / widthPx;
  const degPerPxY = (bbox.north - bbox.south) / heightPx;
  const colorBytes = colorsToBytes(colors);

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");

  const cols = Math.ceil(widthPx / CHUNK);
  const rows = Math.ceil(heightPx / CHUNK);
  const total = cols * rows;
  let done = 0;

  const jobs = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = c * CHUNK;
      const py = r * CHUNK; // canvas y grows downward; north is py=0
      // Worker renders a CHUNK×CHUNK square; we crop overflow when drawing.
      const west = bbox.west + px * degPerPxX;
      const east = west + CHUNK * degPerPxX;
      const north = bbox.north - py * degPerPxY;
      const south = north - CHUNK * degPerPxY;

      const job = pool
        .render({
          west,
          south,
          east,
          north,
          tileSize: CHUNK,
          maxIterations,
          gradientFunction,
          colors: colorBytes,
        })
        .then(({ rgba, width, height }) => {
          if (signal && signal.aborted) return;
          const img = new ImageData(
            new Uint8ClampedArray(rgba.buffer || rgba),
            width,
            height
          );
          ctx.putImageData(img, px, py);
          done += 1;
          if (onProgress) onProgress(done, total);
        });
      jobs.push(job);
    }
  }

  await Promise.all(jobs);
  if (signal && signal.aborted) throw new Error("Export cancelled");

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("PNG encoding failed"))),
      "image/png"
    );
  });
}

/** Filename embedding the location so a print can always be found again. */
export function exportFilename({ x, y, z, name }) {
  const stem = name
    ? name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()
    : "mandelbrot";
  return `${stem}_x${x.toFixed(12)}_y${y.toFixed(12)}_z${z.toFixed(2)}.png`;
}
