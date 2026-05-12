/* A small pool of Web Workers that render Mandelbrot tiles in parallel.
 *
 * Tiles are coarse-grained units of work, so a pool of independent workers
 * (each with its own WASM instance) gives near-linear speed-up across cores and
 * keeps tile generation off the main thread — without needing SharedArrayBuffer
 * or COOP/COEP headers.
 *
 * Returns `null` if Web Workers / module workers aren't usable in this
 * environment; callers should fall back to rendering on the main thread.
 */

const MAX_WORKERS = 12;

let poolSingleton; // undefined = not yet created; null = unavailable; object = the pool

function spawnWorker() {
  // Webpack 5 (CRA 5) understands `new Worker(new URL(...), { type: "module" })`
  // and bundles the worker + its WASM asset.
  return new Worker(new URL("./mandelbrotWorker.js", import.meta.url), {
    type: "module",
  });
}

function createPool() {
  if (typeof Worker === "undefined") return null;

  const count = Math.max(
    1,
    Math.min(navigator.hardwareConcurrency || 4, MAX_WORKERS)
  );

  let slots;
  try {
    slots = Array.from({ length: count }, () => ({
      worker: spawnWorker(),
      busy: false,
    }));
  } catch (e) {
    return null;
  }

  const pending = new Map(); // id -> { resolve, reject, slot }
  const queue = []; // [{ message, resolve, reject }]
  let nextId = 1;

  const pump = () => {
    if (queue.length === 0) return;
    const slot = slots.find((s) => !s.busy);
    if (!slot) return;
    const job = queue.shift();
    const id = nextId++;
    slot.busy = true;
    pending.set(id, { resolve: job.resolve, reject: job.reject, slot });
    slot.worker.postMessage({ ...job.message, id });
    // Try to fill another idle worker if there's more queued work.
    if (queue.length > 0) pump();
  };

  const failSlot = (slot, err) => {
    for (const [id, entry] of pending) {
      if (entry.slot === slot) {
        pending.delete(id);
        entry.reject(err);
      }
    }
    slot.busy = false;
  };

  slots.forEach((slot) => {
    slot.worker.onmessage = (event) => {
      const { id, ok, rgba, width, height, error } = event.data;
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      entry.slot.busy = false;
      if (ok) entry.resolve({ rgba, width, height });
      else entry.reject(new Error(error || "tile worker failed"));
      pump();
    };
    slot.worker.onerror = (event) => {
      failSlot(slot, new Error("tile worker error: " + (event.message || event.type)));
      pump();
    };
  });

  return {
    workerCount: count,
    render(message) {
      return new Promise((resolve, reject) => {
        queue.push({ message, resolve, reject });
        pump();
      });
    },
  };
}

export function getTilePool() {
  if (poolSingleton === undefined) {
    poolSingleton = createPool();
  }
  return poolSingleton;
}
