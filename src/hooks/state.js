// Imports
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { atom, useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { decodeColors, encodeColors } from "../utilities/colors";
import { createTileLayer as createTileLayerJs } from "../layers/TileLayerPureJS";
import { createTileLayer as createTileLayerRust } from "../layers/TileLayerRustWASM";

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

// Every gradient — `standard` included — renders through the Rust/WASM tile
// pipeline. f64 inside Rust stays accurate up to roughly zoom ~40 before the
// tile coordinates themselves run out of mantissa; past that, the deep-zoom
// viewer takes over with arbitrary-precision-reference perturbation.
const MAX_ZOOM = 40;

// Zoom at which we hand off from deck.gl to DeepZoomView (and vice versa).
// Picked just below MAX_ZOOM so the f64 deck.gl renderer still has a bit of
// headroom when the user crosses the threshold.
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

// make useMaxIterations work by either using the atom, or if useAutoScaleMaxIterations is true,
// then use the scaling function
export const useMaxIterations = () => {
  const [maxIterations, setMaxIterations] = useAtom(maxIterationsAtom);
  const [max, setMax] = useState(maxIterations);

  const [autoScaleMaxIterations] = useAutoScaleMaxIterations();
  const [z] = useZ();

  useEffect(() => {
    const idealMaxIterations = Math.floor(10 * z ** 2);
    // only update max at zoom levels that more than 20% from the ideal,
    // this reduces re-making the TileLayer
    if (
      autoScaleMaxIterations &&
      Math.abs(max - idealMaxIterations) > 0.2 * idealMaxIterations
    ) {
      setMax(Math.floor(1 * z ** 2.5));
    }
  }, [z, max, autoScaleMaxIterations, maxIterations]);

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

export const useTileLayer = () => {
  const [maxIterations] = useMaxIterations();
  const [colors] = useColors();
  const [gradientFunction] = useGradientFunction();

  return useMemo(() => {
    const createTileLayer = WASM_AVAILABLE ? createTileLayerRust : createTileLayerJs;
    return createTileLayer({
      maxIterations,
      colors,
      gradientFunction,
      maxZoom: MAX_ZOOM,
    });
  }, [maxIterations, colors, gradientFunction]);
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
