/* Deep-zoom viewer.
 *
 * Takes over from deck.gl past ~zoom 38, where deck.gl's f64 view-state can no
 * longer represent the coordinates accurately. Owns its own high-precision
 * centre (re/im as decimal strings), its own continuous zoom number, and its
 * own <canvas>. Per-tile rendering goes through `deepWorker.js`, which holds
 * the perturbation `ReferenceOrbit` for the current viewport. Pan/zoom updates
 * the centre through the WASM `add_to_decimal` helper so we don't lose
 * precision in JS.
 *
 * v1 limitations: drag flashes on release (no offscreen-canvas swap); the
 * reference orbit is recomputed on every render rather than reused across pans
 * that haven't moved out of bounds; URL state and library/screenshot integration
 * not yet wired in.
 */
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import Tooltip from "@mui/material/Tooltip";

import init, { add_to_decimal } from "wasm-lib";

import {
  useColors,
  useDeepZoomActive,
  useDeepCenter,
  useDeepZoomLevel,
  useGradientFunction,
  useMaxIterations,
  useX,
  useY,
  useZ,
  DEEP_ZOOM_THRESHOLD,
} from "../hooks/state";

const TILE_SIZE = 256;

// Complex units per CSS pixel — matches deck.gl's web-mercator pixel scale so
// the two views' zoom axes line up at the hand-off.
const scaleAt = (zoom) => 360 / (512 * Math.pow(2, zoom));

// Bits of precision the reference orbit needs at this zoom. 1 zoom level
// halves the pixel scale (≈ 1 bit), so reserve ceil(zoom * log2(2)) = zoom bits
// for the depth, plus ~64 guard bits. Multiplied by ~3.4 to stay generous.
const precisionBitsFor = (zoom) => Math.max(64, Math.ceil(zoom * 3.4) + 64);

const RENDER_DEBOUNCE_MS = 80;

function colorsToBytes(colors) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return new Uint8Array([
    c(colors.start.r), c(colors.start.g), c(colors.start.b),
    c(colors.middle.r), c(colors.middle.g), c(colors.middle.b),
    c(colors.end.r), c(colors.end.g), c(colors.end.b),
    c(colors.black.r), c(colors.black.g), c(colors.black.b),
  ]);
}

// One shared deep worker for the lifetime of the app.
let workerSingleton = null;
let nextMessageId = 1;
const pending = new Map();
function getDeepWorker() {
  if (workerSingleton) return workerSingleton;
  workerSingleton = new Worker(new URL("../workers/deepWorker.js", import.meta.url), { type: "module" });
  workerSingleton.onmessage = (e) => {
    const { id } = e.data;
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    entry.resolve(e.data);
  };
  workerSingleton.onerror = (err) => {
    for (const [id, entry] of pending) {
      pending.delete(id);
      entry.reject(err);
    }
  };
  return workerSingleton;
}
function deepSend(message) {
  const worker = getDeepWorker();
  const id = nextMessageId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    worker.postMessage({ ...message, id });
  });
}

// Lazy main-thread WASM init for the `add_to_decimal` calls (the helper is
// cheap and synchronous; making JS round-trip to a worker for every wheel/drag
// event would only add latency).
let mainThreadReady = null;
function ensureMainThreadWasm() {
  if (!mainThreadReady) mainThreadReady = init().then(() => true);
  return mainThreadReady;
}

export default function DeepZoomView() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [centerRe, setCenterRe, centerIm, setCenterIm] = useDeepCenter();
  const [zoom, setZoom] = useDeepZoomLevel();
  const [, setDeepActive] = useDeepZoomActive();
  const [maxIterations] = useMaxIterations();
  const [colors] = useColors();
  const [gradientFunction] = useGradientFunction();

  // For the hand-off back to deck.gl: when we exit, push the current location
  // into the shared x/y/z atoms (truncated to f64) so deck.gl picks it up.
  const [, setX] = useX();
  const [, setY] = useY();
  const [, setZ] = useZ();

  // Render-generation counter so a late-arriving tile from a previous viewport
  // is discarded instead of stomping the canvas.
  const renderGenRef = useRef(0);
  const renderTimerRef = useRef(null);

  const exitDeepZoom = useCallback(() => {
    setX(parseFloat(centerRe) || 0);
    setY(parseFloat(centerIm) || 0);
    // Drop just below the threshold so the user can keep zooming with deck.gl.
    setZ(Math.min(zoom, DEEP_ZOOM_THRESHOLD - 0.5));
    setDeepActive(false);
  }, [centerRe, centerIm, zoom, setX, setY, setZ, setDeepActive]);

  const renderAll = useCallback(async () => {
    const myGen = ++renderGenRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return;
    const cxPx = w / 2;
    const cyPx = h / 2;
    const scale = scaleAt(zoom);
    const precBits = precisionBitsFor(zoom);

    // Compute the reference orbit for the current centre. (v1: every render.)
    let refResp;
    try {
      refResp = await deepSend({
        type: "reference",
        re: centerRe,
        im: centerIm,
        maxIterations,
        precisionBits: precBits,
      });
    } catch (err) {
      console.error("deep reference orbit failed:", err);
      return;
    }
    if (myGen !== renderGenRef.current) return;
    if (!refResp.ok) {
      console.error("deep reference orbit failed:", refResp.error);
      return;
    }
    const orbitGen = refResp.orbitGen;

    const ctx = canvas.getContext("2d");
    const colorBytes = colorsToBytes(colors);

    // Tile grid covering the canvas, starting flush at the top-left. Each tile
    // (i, j) covers canvas pixels [i*TILE, (i+1)*TILE) × [j*TILE, (j+1)*TILE).
    const tilesX = Math.ceil(w / TILE_SIZE);
    const tilesY = Math.ceil(h / TILE_SIZE);

    // Order: spiral out from the centre tile so the user sees the most useful
    // pixels first.
    const order = [];
    const cx = Math.floor(tilesX / 2);
    const cy = Math.floor(tilesY / 2);
    for (let j = 0; j < tilesY; j++) {
      for (let i = 0; i < tilesX; i++) {
        order.push({ i, j, d: Math.hypot(i - cx, j - cy) });
      }
    }
    order.sort((a, b) => a.d - b.d);

    for (const { i, j } of order) {
      const x0 = i * TILE_SIZE;
      const y0 = j * TILE_SIZE;
      // Complex offset of each pixel = (pixelX - centerPx) * scale; canvas y
      // grows downward but the imaginary axis grows upward, so flip.
      const dWest = (x0 - cxPx) * scale;
      const dEast = (x0 + TILE_SIZE - cxPx) * scale;
      const dNorth = -(y0 - cyPx) * scale;
      const dSouth = -(y0 + TILE_SIZE - cyPx) * scale;

      // Fire-and-handle; tiles arrive in completion order. Don't block the
      // queue waiting on this one — let workers parallelise.
      deepSend({
        type: "tile",
        orbitGen,
        dWest,
        dSouth,
        dEast,
        dNorth,
        tileSize: TILE_SIZE,
        maxIterations,
        gradientFunction,
        colors: colorBytes,
      }).then(
        (resp) => {
          if (myGen !== renderGenRef.current) return;
          if (!resp.ok) return;
          ctx.putImageData(new ImageData(resp.rgba, TILE_SIZE, TILE_SIZE), x0, y0);
        },
        () => {}
      );
    }
  }, [centerRe, centerIm, zoom, maxIterations, colors, gradientFunction]);

  // Schedule a debounced render whenever inputs change.
  useEffect(() => {
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(renderAll, RENDER_DEBOUNCE_MS);
    return () => {
      if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    };
  }, [renderAll]);

  // Match canvas size to its CSS rect; re-render after resize.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width));
      canvas.height = Math.max(1, Math.floor(rect.height));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      renderAll();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, [renderAll]);

  // ---- gestures ----

  // Drag pan: CSS-translate the canvas during the gesture, commit a new centre
  // on release. (v1: brief flash on release as the new tiles arrive.)
  const dragRef = useRef(null);
  const onPointerDown = (e) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    dragRef.current.dx = e.clientX - dragRef.current.startX;
    dragRef.current.dy = e.clientY - dragRef.current.startY;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transform = `translate(${dragRef.current.dx}px, ${dragRef.current.dy}px)`;
    }
  };
  const onPointerUp = async (e) => {
    if (!dragRef.current) return;
    const { dx, dy } = dragRef.current;
    dragRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) canvas.style.transform = "";
    if (dx === 0 && dy === 0) return;
    const scale = scaleAt(zoom);
    const precBits = precisionBitsFor(zoom);
    await ensureMainThreadWasm();
    // Pan: drag-right moves centre LEFT in complex coordinates (the image
    // moves with the cursor). Y is flipped (canvas-down vs im-up).
    try {
      const newRe = add_to_decimal(centerRe, -dx * scale, precBits);
      const newIm = add_to_decimal(centerIm, dy * scale, precBits);
      setCenterRe(newRe);
      setCenterIm(newIm);
    } catch (err) {
      console.error("add_to_decimal failed during pan:", err);
    }
  };

  // Wheel zoom toward the cursor.
  const onWheel = async (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const cxPx = canvas.width / 2;
    const cyPx = canvas.height / 2;
    // Half a zoom level per wheel notch, with a cap so a frantic trackpad burst
    // doesn't skip miles.
    const dZoom = Math.max(-1.5, Math.min(1.5, -e.deltaY * 0.005));
    const newZoom = zoom + dZoom;
    if (newZoom < DEEP_ZOOM_THRESHOLD) {
      // Zoomed back into deck.gl territory — hand off.
      exitDeepZoom();
      return;
    }
    const oldScale = scaleAt(zoom);
    const newScale = scaleAt(newZoom);
    const dxRe = (cursorX - cxPx) * (oldScale - newScale);
    const dyIm = -(cursorY - cyPx) * (oldScale - newScale);
    const precBits = precisionBitsFor(newZoom);
    await ensureMainThreadWasm();
    try {
      const newRe = add_to_decimal(centerRe, dxRe, precBits);
      const newIm = add_to_decimal(centerIm, dyIm, precBits);
      setCenterRe(newRe);
      setCenterIm(newIm);
      setZoom(newZoom);
    } catch (err) {
      console.error("add_to_decimal failed during zoom:", err);
    }
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#000",
        touchAction: "none",
      }}
      onWheel={onWheel}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ display: "block", cursor: "grab" }}
      />
      <Tooltip title="Exit deep zoom (back to map)">
        <IconButton
          onClick={exitDeepZoom}
          size="small"
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            backgroundColor: "rgba(255,255,255,0.85)",
            "&:hover": { backgroundColor: "rgba(255,255,255,1)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Box
        sx={{
          position: "absolute",
          bottom: 8,
          left: 8,
          padding: "4px 8px",
          backgroundColor: "rgba(255,255,255,0.85)",
          borderRadius: 1,
          fontFamily: "monospace",
          fontSize: 12,
          pointerEvents: "none",
        }}
      >
        zoom {zoom.toFixed(2)} · deep · precision {precisionBitsFor(zoom)} bits
      </Box>
    </Box>
  );
}
