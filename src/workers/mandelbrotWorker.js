/* Web Worker: renders Mandelbrot tiles via the Rust/WASM renderers.
 *
 * Each worker instantiates its own copy of the WASM module (independent linear
 * memory — no SharedArrayBuffer, so no cross-origin-isolation headers needed).
 * The pool in `tilePool.js` hands whole tiles here and gets back a finished
 * RGBA buffer, which is transferred (zero-copy) rather than cloned.
 *
 * Message `mode`:
 *   (absent)     — legacy `render_tile` (integer iterations, 1 sample/px).
 *   "crisp"      — `render_tile_crisp`: smooth colouring + adaptive
 *                  supersampling (`aa`) + distance-estimate shading (`de`).
 *   "perturbed"  — `render_tile_perturbed` against a high-precision reference
 *                  orbit; bbox fields are *deltas from the reference point*.
 *                  `ref: { key, cRe, cIm, zoomBits, maxIterations, dcMax }`
 *                  describes the reference; each worker builds and caches its
 *                  own copy keyed by `key` (cheap: ms at moderate depth).
 */
/* eslint-disable no-restricted-globals */
import init, {
  render_tile,
  render_tile_crisp,
  render_tile_perturbed,
  Reference,
} from "wasm-lib";

const ready = init().then(() => true);

// Small LRU of reference orbits, keyed by the view that produced them.
const REF_CACHE_SIZE = 3;
const refCache = new Map(); // key -> Reference

function getReference(ref) {
  const hit = refCache.get(ref.key);
  if (hit) {
    // refresh LRU order
    refCache.delete(ref.key);
    refCache.set(ref.key, hit);
    return hit;
  }
  const built = new Reference(
    ref.cRe,
    ref.cIm,
    ref.zoomBits,
    ref.maxIterations,
    ref.dcMax
  );
  refCache.set(ref.key, built);
  while (refCache.size > REF_CACHE_SIZE) {
    const oldest = refCache.keys().next().value;
    const victim = refCache.get(oldest);
    refCache.delete(oldest);
    if (victim && victim.free) victim.free();
  }
  return built;
}

self.onmessage = async (event) => {
  const {
    id,
    mode,
    west,
    south,
    east,
    north,
    tileSize,
    width,
    height,
    maxIterations,
    gradientFunction,
    colors, // Uint8Array(12): start RGB, middle RGB, end RGB, black RGB
    aa = 2,
    de = 0.6,
    ref,
  } = event.data;
  const w = width || tileSize;
  const h = height || tileSize;

  try {
    await ready;
    let rgba;
    if (mode === "perturbed") {
      const reference = getReference(ref);
      rgba = render_tile_perturbed(
        reference,
        west,
        south,
        east,
        north,
        w,
        h,
        maxIterations,
        gradientFunction,
        colors,
        aa,
        de
      );
    } else if (mode === "crisp") {
      rgba = render_tile_crisp(
        west,
        south,
        east,
        north,
        w,
        h,
        maxIterations,
        gradientFunction,
        colors,
        aa,
        de
      );
    } else {
      rgba = render_tile(
        west,
        south,
        east,
        north,
        w,
        h,
        maxIterations,
        gradientFunction,
        colors
      );
    }
    // `rgba` is a Uint8ClampedArray backed by a fresh ArrayBuffer -> transferable.
    self.postMessage({ id, ok: true, rgba, width: w, height: h }, [rgba.buffer]);
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
};
