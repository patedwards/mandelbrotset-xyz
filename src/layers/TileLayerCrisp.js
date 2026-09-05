/* Crisp tile layer: smooth colouring, adaptive supersampling, distance-estimate
 * filament shading — and perturbation for deep tiles.
 *
 * Shallow tiles (tile z below PERTURB_FROM_ZOOM) go through
 * `render_tile_crisp` in plain f64. Deeper tiles are rendered against a
 * high-precision *reference orbit* at the current view centre
 * (`render_tile_perturbed`): the reference is iterated in fixed-point big
 * integers inside the worker, every pixel is a small f64 delta from it, and
 * bilinear approximation skips most of the iterations. This is the standard
 * deep-zoom technique (Kalles Fraktaler, Fraktaler-3) and the reason GPU
 * f32 was never going to work: precision has to live in one point, not in
 * every pixel.
 *
 * Reference anchor: `setViewCenter(x, y, z)` is called from Map.js on every
 * view-state change; a new anchor is minted only when the centre drifts more
 * than a quarter of the view or the zoom changes by more than 2 levels, so
 * in-flight tiles keep using a stable reference. Tiles are independent (each
 * bbox is rendered correctly against whichever anchor was current), so mixing
 * anchors across the cache is fine.
 *
 * LIMIT (until the floating-origin viewer lands — Phase 2): tile bboxes come
 * from deck.gl as f64 lng/lat, so beyond tile z ≈ 44 the bbox itself is
 * quantised. The Rust side already takes deltas and is exact to 2^-300+; the
 * JS side needs to hand it bigfloat-anchored offsets to go further.
 */
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";

import { getTilePool, setViewCenter as setPoolViewCenter } from "../workers/tilePool";

const TILE_SIZE = 256;
const PREVIEW_PIXELS = 64;
// Deck zoom of the tile at which plain f64 stops being safely exact for a
// 256-px tile (52 mantissa bits − 8 tile bits − headroom).
export const PERTURB_FROM_ZOOM = 30;

let anchor = null; // { key, cRe, cIm, x, y, z }

/** Iteration budget for a tile at integer zoom `z` when autoscale is on —
 *  same curve the UI autoscale used, but evaluated per tile so the layer
 *  never has to be rebuilt as the view zooms across a threshold. */
export function iterationsForZoom(z) {
  return Math.max(60, Math.floor(Math.pow(Math.max(z, 1), 2.5)));
}

export function setViewCenter(x, y, z) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
  setPoolViewCenter(x, y);
  const halfWidth = Math.pow(2, -z) * 360 * 0.5; // rough view half-extent in plane units
  const moved =
    !anchor ||
    Math.abs(x - anchor.x) > halfWidth * 0.5 ||
    Math.abs(y - anchor.y) > halfWidth * 0.5 ||
    Math.abs(z - anchor.z) > 2;
  if (!moved) return;
  anchor = {
    key: `${x},${y},${Math.round(z)}`,
    // Largest |δc| the BLA table must cover: everything within a few view
    // widths of the anchor (tiles further out are rendered without BLA).
    dcMax: halfWidth * 8,
    // Decimal strings: with f64 view state that is 17 significant digits.
    // Phase 2 replaces this with the bigfloat anchor string.
    cRe: x.toString(),
    cIm: y.toString(),
    x,
    y,
    z,
  };
}

function clampByte(x) {
  return Math.max(0, Math.min(255, Math.round(x)));
}

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

function makeLayer({
  id,
  pixels,
  priority,
  maxIterations,
  autoScaleIterations,
  colors,
  colorBytes,
  gradientFunction,
  maxZoom,
  aa,
  de,
  pool,
}) {
  return new TileLayer({
    id,
    minZoom: 0,
    maxZoom,
    tileSize: TILE_SIZE,
    // Keep every worker busy with headroom for the queue to reorder.
    maxRequests: pool ? pool.workerCount * 2 : 6,
    // Zooming back out should hit cache, not re-render.
    maxCacheSize: 600,
    refinementStrategy: "best-available",
    updateTriggers: {
      getTileData: {
        // With autoscale on, the iteration count is a function of the tile,
        // not of the view — so it must NOT invalidate the layer.
        maxIterations: autoScaleIterations ? "auto" : maxIterations,
        gradientFunction,
        colors,
        aa,
        de,
        pixels,
      },
    },
    getTileData: async ({ bbox: { west, south, east, north }, z, signal }) => {
      if (!pool) throw new Error("crisp renderer needs the worker pool");
      const iterations = autoScaleIterations ? iterationsForZoom(z) : maxIterations;
      const base = {
        width: pixels,
        height: pixels,
        maxIterations: iterations,
        gradientFunction,
        colors: colorBytes,
        aa,
        de,
      };
      const opts = {
        priority,
        cx: (west + east) / 2,
        cy: (south + north) / 2,
        signal,
      };
      let res;
      if (z >= PERTURB_FROM_ZOOM && anchor) {
        // Deltas from the reference point. Exact in f64 as long as the
        // bbox itself is (see LIMIT above).
        res = await pool.render(
          {
            ...base,
            mode: "perturbed",
            west: west - anchor.x,
            south: south - anchor.y,
            east: east - anchor.x,
            north: north - anchor.y,
            ref: {
              key: anchor.key,
              cRe: anchor.cRe,
              cIm: anchor.cIm,
              zoomBits: z + 8,
              maxIterations: iterations,
              dcMax: anchor.dcMax,
            },
          },
          opts
        );
      } else {
        res = await pool.render(
          { ...base, mode: "crisp", west, south, east, north },
          opts
        );
      }
      const rgba = res.rgba;
      return new ImageData(
        rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba.buffer || rgba),
        pixels,
        pixels
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
}

/**
 * Returns TWO layers (deck.gl flattens nested arrays): a 64-px preview layer
 * that resolves ~16× faster and sits underneath, and the full-res crisp layer
 * on top. Preview jobs run at priority 0, full-res at 1, so a moving view
 * always gets a coarse picture first and never shows a blank area.
 */
export const createTileLayer = ({
  maxIterations,
  autoScaleIterations = true,
  colors,
  gradientFunction,
  maxZoom,
  aa = 2, // supersampling grid for edge pixels (2 interactive, 3–4 export)
  de = 0.6, // distance-estimate filament shading strength, 0..1
  pixelRatio = 1, // 2 on retina: render 512-px tiles for 256-px tile bounds
}) => {
  const colorBytes = colorsToBytes(colors);
  const pool = getTilePool();
  const common = {
    maxIterations,
    autoScaleIterations,
    colors,
    colorBytes,
    gradientFunction,
    maxZoom,
    pool,
  };
  const preview = makeLayer({
    ...common,
    id: "mandelbrot-preview",
    pixels: PREVIEW_PIXELS,
    priority: 0,
    aa: 1,
    de: 0,
  });
  const full = makeLayer({
    ...common,
    id: "mandelbrot-crisp",
    pixels: Math.round(TILE_SIZE * pixelRatio),
    priority: 1,
    aa,
    de,
  });
  return [preview, full];
};
