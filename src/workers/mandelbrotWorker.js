/* Web Worker: renders Mandelbrot tiles via the Rust/WASM `render_tile`.
 *
 * Each worker instantiates its own copy of the WASM module (independent linear
 * memory — no SharedArrayBuffer, so no cross-origin-isolation headers needed).
 * The pool in `tilePool.js` hands whole tiles here and gets back a finished
 * RGBA buffer, which is transferred (zero-copy) rather than cloned.
 */
/* eslint-disable no-restricted-globals */
import init, { render_tile } from "wasm-lib";

const ready = init().then(() => true);

self.onmessage = async (event) => {
  const {
    id,
    west,
    south,
    east,
    north,
    tileSize,
    maxIterations,
    gradientFunction,
    colors, // Uint8Array(12): start RGB, middle RGB, end RGB, black RGB
  } = event.data;

  try {
    await ready;
    const rgba = render_tile(
      west,
      south,
      east,
      north,
      tileSize,
      tileSize,
      maxIterations,
      gradientFunction,
      colors
    );
    // `rgba` is a Uint8ClampedArray backed by a fresh ArrayBuffer -> transferable.
    self.postMessage(
      { id, ok: true, rgba, width: tileSize, height: tileSize },
      [rgba.buffer]
    );
  } catch (err) {
    self.postMessage({
      id,
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
};
