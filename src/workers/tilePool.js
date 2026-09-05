/* A small pool of Web Workers that render Mandelbrot tiles in parallel.
 *
 * Tiles are coarse-grained units of work, so a pool of independent workers
 * (each with its own WASM instance) gives near-linear speed-up across cores and
 * keeps tile generation off the main thread — without needing SharedArrayBuffer
 * or COOP/COEP headers.
 *
 * Scheduling (what makes pan/zoom feel responsive):
 *  - Jobs carry a `priority` (lower runs first) and optionally a tile centre
 *    (`cx`, `cy`); at dequeue time the queue is ordered by priority, then by
 *    distance from the *current* view centre (`setViewCenter`), so tiles under
 *    the cursor render before tiles at the edge, even if they were queued later.
 *  - Jobs accept an AbortSignal (`signal`). Aborting a queued job removes it
 *    (rejecting with a DOMException 'AbortError', which deck.gl's TileLayer
 *    treats as "tile no longer needed"); aborting a running job lets the WASM
 *    call finish but drops the result. WASM is never interrupted mid-tile.
 *  - A worker that fails to initialise is dropped from the pool rather than
 *    silently absorbing jobs.
 *
 * Returns `null` if Web Workers / module workers aren't usable in this
 * environment; callers should fall back to rendering on the main thread.
 */

const MAX_WORKERS = 12;

let poolSingleton; // undefined = not yet created; null = unavailable; object = the pool

let viewCenter = { x: 0, y: 0 };
export function setViewCenter(x, y) {
  if (Number.isFinite(x) && Number.isFinite(y)) viewCenter = { x, y };
}

// Dev-only counters so the acceptance criteria are observable in the console.
export const poolStats = { queued: 0, started: 0, aborted: 0, dropped: 0 };

function spawnWorker() {
  // Webpack 5 (CRA 5) understands `new Worker(new URL(...), { type: "module" })`
  // and bundles the worker + its WASM asset.
  return new Worker(new URL("./mandelbrotWorker.js", import.meta.url), {
    type: "module",
  });
}

function abortError() {
  try {
    return new DOMException("tile render aborted", "AbortError");
  } catch (e) {
    const err = new Error("tile render aborted");
    err.name = "AbortError";
    return err;
  }
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
      dead: false,
    }));
  } catch (e) {
    return null;
  }

  const pending = new Map(); // id -> { resolve, reject, slot, aborted }
  const queue = []; // [{ message, resolve, reject, priority, cx, cy, onAbort, signal }]
  let nextId = 1;

  const rank = (job) => {
    const dx = (job.cx ?? viewCenter.x) - viewCenter.x;
    const dy = (job.cy ?? viewCenter.y) - viewCenter.y;
    return [job.priority ?? 0, dx * dx + dy * dy];
  };

  const takeNext = () => {
    if (queue.length === 0) return null;
    let bestIdx = 0;
    let best = rank(queue[0]);
    for (let i = 1; i < queue.length; i++) {
      const r = rank(queue[i]);
      if (r[0] < best[0] || (r[0] === best[0] && r[1] < best[1])) {
        best = r;
        bestIdx = i;
      }
    }
    return queue.splice(bestIdx, 1)[0];
  };

  const pump = () => {
    for (;;) {
      if (queue.length === 0) return;
      const slot = slots.find((s) => !s.busy && !s.dead);
      if (!slot) return;
      const job = takeNext();
      if (job.signal) job.signal.removeEventListener("abort", job.onAbort);
      const id = nextId++;
      slot.busy = true;
      const entry = { resolve: job.resolve, reject: job.reject, slot, aborted: false };
      pending.set(id, entry);
      if (job.signal) {
        const onRunningAbort = () => {
          entry.aborted = true;
        };
        job.signal.addEventListener("abort", onRunningAbort, { once: true });
        entry.cleanup = () => job.signal.removeEventListener("abort", onRunningAbort);
      }
      poolStats.started += 1;
      slot.worker.postMessage({ ...job.message, id });
    }
  };

  const failSlot = (slot, err) => {
    for (const [id, entry] of pending) {
      if (entry.slot === slot) {
        pending.delete(id);
        if (entry.cleanup) entry.cleanup();
        entry.reject(err);
      }
    }
    slot.busy = false;
  };

  slots.forEach((slot) => {
    slot.worker.onmessage = (event) => {
      const { id, ok, rgba, width, height, error, ready } = event.data;
      if (ready !== undefined) {
        // Readiness report from the worker's init; a failed init retires it.
        if (!ready) {
          slot.dead = true;
          failSlot(slot, new Error("tile worker failed to initialise: " + error));
          pump();
        }
        return;
      }
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      entry.slot.busy = false;
      if (entry.cleanup) entry.cleanup();
      if (entry.aborted) {
        poolStats.dropped += 1;
        entry.reject(abortError());
      } else if (ok) entry.resolve({ rgba, width, height });
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
    get liveWorkerCount() {
      return slots.filter((s) => !s.dead).length;
    },
    /**
     * Queue a render. `opts`: { priority, cx, cy, signal }.
     *  - priority: lower first (preview tiles 0, full-res 1, export 2).
     *  - cx, cy: tile centre in plane units, for distance ordering.
     *  - signal: AbortSignal.
     */
    render(message, opts = {}) {
      return new Promise((resolve, reject) => {
        const { priority = 1, cx, cy, signal } = opts;
        if (signal && signal.aborted) {
          reject(abortError());
          return;
        }
        const job = { message, resolve, reject, priority, cx, cy, signal };
        if (signal) {
          job.onAbort = () => {
            const i = queue.indexOf(job);
            if (i >= 0) {
              queue.splice(i, 1);
              poolStats.aborted += 1;
              reject(abortError());
            }
          };
          signal.addEventListener("abort", job.onAbort, { once: true });
        }
        queue.push(job);
        poolStats.queued += 1;
        pump();
      });
    },
    get queueLength() {
      return queue.length;
    },
  };
}

export function getTilePool() {
  if (poolSingleton === undefined) {
    poolSingleton = createPool();
  }
  return poolSingleton;
}
