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

import { getTilePool } from "../workers/tilePool";

const TILE_SIZE = 256;
// Deck zoom of the tile at which plain f64 stops being safely exact for a
// 256-px tile (52 mantissa bits − 8 tile bits − headroom).
export const PERTURB_FROM_ZOOM = 30;

let anchor = null; // { key, cRe, cIm, x, y, z }

export function setViewCenter(x, y, z) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
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

export const createTileLayer = ({
  maxIterations,
  colors,
  gradientFunction,
  maxZoom,
  aa = 2, // supersampling grid for edge pixels (2 interactive, 3–4 export)
  de = 0.6, // distance-estimate filament shading strength, 0..1
  pixelRatio = 1, // 2 on retina: render 512-px tiles for 256-px tile bounds
}) => {
  const colorBytes = colorsToBytes(colors);
  const pool = getTilePool();
  const px = Math.round(TILE_SIZE * pixelRatio);

  return new TileLayer({
    id: "mandelbrot-crisp",
    minZoom: 0,
    maxZoom,
    tileSize: TILE_SIZE,
    maxRequests: pool ? pool.workerCount * 2 : 6,
    updateTriggers: {
      getTileData: { maxIterations, gradientFunction, colors, aa, de, pixelRatio },
    },
    getTileData: async ({ bbox: { west, south, east, north }, z }) => {
      if (!pool) throw new Error("crisp renderer needs the worker pool");
      const base = {
        width: px,
        height: px,
        maxIterations,
        gradientFunction,
        colors: colorBytes,
        aa,
        de,
      };
      let res;
      if (z >= PERTURB_FROM_ZOOM && anchor) {
        // Deltas from the reference point. Exact in f64 as long as the
        // bbox itself is (see LIMIT above).
        res = await pool.render({
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
            maxIterations,
            dcMax: anchor.dcMax,
          },
        });
      } else {
        res = await pool.render({ ...base, mode: "crisp", west, south, east, north });
      }
      const rgba = res.rgba;
      return new ImageData(
        rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba.buffer || rgba),
        px,
        px
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
