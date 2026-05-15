// Imports
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { atom, useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { decodeColors, encodeColors } from "../utilities/colors";
import { createTileLayer as createTileLayerJs } from "../layers/TileLayerPureJS";
import { createTileLayer as createTileLayerRust } from "../layers/TileLayerRustWASM";
import { createTileLayer as createTileLayerGl } from "../layers/TileLayerGL";

// Parse URL parameters once, at module load, so the jotai atoms can initialise
// with the right values *before* the first render. Anything missing falls back
// to the previous defaults. After parsing we strip these params from the
// address bar — the InfoPanel "share" link regenerates them on demand.
const URL_INIT = (() => {
  const defaults = {
    x: 0.3324769434398682,
    y: 0.07645044256287752,
    z: 8.383395990576519,
    maxIterations: 60,
    gradientFunction: "standard",
    colors: {
      start: { r: 44, g: 0, b: 30, hex: "#2C001E" },
      middle: { r: 233, g: 84, b: 32, hex: "#E95420" },
      end: { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
      black: { r: 0, g: 0, b: 0, hex: "#000000" },
    },
  };
  if (typeof window === "undefined") return defaults;
  const sp = new URLSearchParams(window.location.search);
  const out = { ...defaults };
  if (sp.has("x")) out.x = parseFloat(sp.get("x"));
  if (sp.has("y")) out.y = parseFloat(sp.get("y"));
  if (sp.has("z")) out.z = parseFloat(sp.get("z"));
  if (sp.has("maxIterations")) out.maxIterations = Number(sp.get("maxIterations")) || defaults.maxIterations;
  if (sp.has("gradientFunction")) out.gradientFunction = sp.get("gradientFunction");
  if (sp.has("colors")) {
    try { out.colors = decodeColors(sp.get("colors")); } catch (_) { /* leave defaults */ }
  }
  // Clear parsed params from the bar.
  ["x", "y", "z", "maxIterations", "gradientFunction", "colors"].forEach((k) => sp.delete(k));
  const qs = sp.toString();
  window.history.replaceState({}, "", qs ? "?" + qs : window.location.pathname);
  return out;
})();

// Three rendering bands, all sharing the same gradient math so the hand-offs
// are visually seamless:
//   z < GL_THRESHOLD              -> GLSL fragment shader (TileLayerGL).
//   GL_THRESHOLD <= z < DEEP_*    -> Rust/WASM tile workers (TileLayerRustWASM).
//   z >= DEEP_ZOOM_THRESHOLD      -> perturbation viewer (DeepZoomView).
//
// GL is ~100x faster per tile than WASM at the same maxIter, but its 32-bit
// floats lose precision past zoom ~22. WASM (f64) carries us another ~16
// zoom levels before the *tile coordinates themselves* run out of mantissa.
const MAX_ZOOM = 40;
const GL_THRESHOLD = 22;
export const DEEP_ZOOM_THRESHOLD = 38;

const WASM_AVAILABLE = typeof WebAssembly !== "undefined";

// Atoms: Global settings
const getStateFromUrlAtom = atom(true);
const showAlertAtom = atom(false);
const showInfoAtom = atom(false);
const autoScaleMaxIterationsAtom = atom(true);

// Atoms: UI states
const libraryOpenAtom = atom(false);
const showControlsAtom = atom(false);

const mapRefAtom = atom(null);
const xAtom = atom(URL_INIT.x);
const yAtom = atom(URL_INIT.y);
const zAtom = atom(URL_INIT.z);
const maxIterationsAtom = atom(URL_INIT.maxIterations);
const colorsAtom = atom(URL_INIT.colors);
const gradientFunctionAtom = atom(URL_INIT.gradientFunction);

// Deep-zoom state. `deepZoomActive` flips on when the user crosses
// DEEP_ZOOM_THRESHOLD; the centre is carried as decimal strings so it can
// hold many more digits than f64.
const deepZoomActiveAtom = atom(false);
const deepCenterReAtom = atom("0");
const deepCenterImAtom = atom("0");
const deepZoomLevelAtom = atom(DEEP_ZOOM_THRESHOLD);

// Basic hooks
export const useShowAlert = () => useAtom(showAlertAtom);
export const useAutoScaleMaxIterations = () =>
  useAtom(autoScaleMaxIterationsAtom);
export const useShowInfo = () => useAtom(showInfoAtom);
export const useLibraryOpen = () => useAtom(libraryOpenAtom);
export const useShowControls = () => useAtom(showControlsAtom);
export const useGetStateFromUrl = () => useAtom(getStateFromUrlAtom);
export const useIsMobile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return isMobile;
};
export const useMapRef = () => useAtom(mapRefAtom);

export const useX = () => useAtom(xAtom);
export const useY = () => useAtom(yAtom);
export const useZ = () => useAtom(zAtom);
//export const useMaxIterations = () => useAtom(maxIterationsAtom);
export const useColors = () => useAtom(colorsAtom);
export const useGradientFunction = () => useAtom(gradientFunctionAtom);

export const useDeepZoomActive = () => useAtom(deepZoomActiveAtom);
export const useDeepZoomLevel = () => useAtom(deepZoomLevelAtom);

// Pair the two centre atoms in one hook for ergonomic destructuring in the
// deep viewer: `[re, setRe, im, setIm] = useDeepCenter()`.
export const useDeepCenter = () => {
  const [re, setRe] = useAtom(deepCenterReAtom);
  const [im, setIm] = useAtom(deepCenterImAtom);
  return [re, setRe, im, setIm];
};

// Auto-scaled escape-iteration cap. The old `z^2.5` formula blew up past
// z~20 (z=30 wanted ~5 000 iterations, z=40 wanted ~10 000) — that was tolerable
// when only GL was used, but expensive once the WASM/CPU renderer takes over.
// Cap it to a gentler linear growth above zoom 20: shallow detail is preserved,
// mid-zoom doesn't punish the worker pool, and the manual override is always
// one toggle away.
const scaleMaxIterations = (z) =>
  Math.floor(Math.min(Math.pow(Math.max(z, 1), 2.5), 80 * z + 200));

export const useMaxIterations = () => {
  const [maxIterations, setMaxIterations] = useAtom(maxIterationsAtom);
  const [max, setMax] = useState(maxIterations);

  const [autoScaleMaxIterations] = useAutoScaleMaxIterations();
  const [z] = useZ();

  useEffect(() => {
    if (!autoScaleMaxIterations) return;
    const ideal = scaleMaxIterations(z);
    // Only nudge when we've drifted more than 20% from the ideal — fewer
    // refetches as the user zooms.
    if (Math.abs(max - ideal) > 0.2 * Math.max(ideal, 1)) {
      setMax(ideal);
    }
  }, [z, max, autoScaleMaxIterations]);

  return [autoScaleMaxIterations ? max : maxIterations, setMaxIterations];
};

// The deck.gl `initialViewState`, derived from whatever the x/y/z atoms hold
// at mount time. URL parsing happened once at module load (see URL_INIT), and
// the deep-zoom hand-off writes back into these atoms before unmounting Map,
// so a re-mount picks up the latest position.
export const useInitialViewState = () => {
  const [x] = useX();
  const [y] = useY();
  const [z] = useZ();
  return useMemo(
    () => [
      {
        longitude: x,
        latitude: y,
        zoom: z,
        bearing: 0,
        pitch: 0,
        maxZoom: MAX_ZOOM,
      },
    ],
    // Capture the values at mount only; deck.gl is uncontrolled afterwards.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
};

// Complex hooks

// Engine picked per zoom band: GL while it's accurate (fastest by far), Rust/
// WASM once GL gets imprecise, pure-JS only as a fallback when WebAssembly is
// missing. `engine` is a stable string that flips only at the threshold, so
// the TileLayer is only recreated when we actually cross the GL/WASM band —
// not on every zoom event.
const pickEngine = (zoom) => {
  if (zoom < GL_THRESHOLD) return "gl";
  return WASM_AVAILABLE ? "wasm" : "js";
};

const ENGINE_FACTORIES = {
  gl: createTileLayerGl,
  wasm: createTileLayerRust,
  js: createTileLayerJs,
};

export const useTileLayer = () => {
  const [maxIterations] = useMaxIterations();
  const [colors] = useColors();
  const [gradientFunction] = useGradientFunction();
  const [z] = useZ();
  const engine = pickEngine(z);

  return useMemo(() => {
    const createTileLayer = ENGINE_FACTORIES[engine] || createTileLayerRust;
    return createTileLayer({
      maxIterations,
      colors,
      gradientFunction,
      maxZoom: MAX_ZOOM,
    });
  }, [maxIterations, colors, gradientFunction, engine]);
};

export const useStateUrl = () => {
  const [x] = useX();
  const [y] = useY();
  const [z] = useZ();
  const [maxIterations] = useMaxIterations();
  const [gradientFunction] = useGradientFunction();
  const [colors] = useColors();

  return `/?x=${x}&y=${y}&z=${z}&maxIterations=${maxIterations}&colors=${encodeColors(
    colors
  )}&gradientFunction=${gradientFunction}`;
};
