/* Web Worker for deep-zoom rendering via the perturbation engine.
 *
 * Holds one `ReferenceOrbit` (a wasm-bindgen handle) for the current viewport
 * inside its own WASM instance — keeping it worker-local avoids any
 * cross-thread WASM-memory plumbing. Two message kinds:
 *
 *   { type: "reference", id, re, im, maxIterations, precisionBits }
 *     -> { id, ok: true, type: "reference", orbitGen, length, escaped }
 *   { type: "tile", id, orbitGen, dWest, dSouth, dEast, dNorth, tileSize,
 *                    maxIterations, gradientFunction, colors }
 *     -> { id, ok: true, type: "tile", rgba, width, height }   (rgba is transferred)
 *
 * `orbitGen` is bumped on every successful "reference" and lets the main thread
 * ignore tile responses from a previous viewport.
 */
/* eslint-disable no-restricted-globals */
import init, { make_reference_orbit, render_tile_perturbed } from "wasm-lib";

const ready = init().then(() => true);
let orbit = null;
let orbitGen = 0;

const reply = (id, payload, transfer) => {
  if (transfer && transfer.length) self.postMessage({ id, ...payload }, transfer);
  else self.postMessage({ id, ...payload });
};

self.onmessage = async (e) => {
  const msg = e.data;
  const id = msg.id;
  try {
    await ready;
    if (msg.type === "reference") {
      if (orbit) {
        orbit.free();
        orbit = null;
      }
      orbit = make_reference_orbit(
        msg.re,
        msg.im,
        msg.maxIterations,
        msg.precisionBits
      );
      orbitGen += 1;
      reply(id, {
        ok: true,
        type: "reference",
        orbitGen,
        length: orbit.length,
        escaped: orbit.escaped,
      });
    } else if (msg.type === "tile") {
      if (!orbit || msg.orbitGen !== orbitGen) {
        reply(id, { ok: false, error: "stale-orbit" });
        return;
      }
      const rgba = render_tile_perturbed(
        orbit,
        msg.dWest,
        msg.dSouth,
        msg.dEast,
        msg.dNorth,
        msg.tileSize,
        msg.tileSize,
        msg.maxIterations,
        msg.gradientFunction,
        msg.colors
      );
      reply(
        id,
        {
          ok: true,
          type: "tile",
          rgba,
          width: msg.tileSize,
          height: msg.tileSize,
        },
        [rgba.buffer]
      );
    } else {
      reply(id, { ok: false, error: `unknown message type: ${msg.type}` });
    }
  } catch (err) {
    reply(id, {
      ok: false,
      error: err && err.message ? err.message : String(err),
    });
  }
};
