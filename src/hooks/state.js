// Imports
import { atom, useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useIsSmallScreen } from "../ui/useMedia";
import { decodeColors, encodeColors } from "../utilities/colors";
import { createTileLayer as createTileLayerJs } from "../layers/TileLayerPureJS";
import { createTileLayer as createTileLayerGl } from "../layers/TileLayerGL";
import { createTileLayer as createTileLayerRust } from "../layers/TileLayerRustWASM";
import { createTileLayer as createTileLayerCrisp } from "../layers/TileLayerCrisp";

// The crisp renderer (smooth colouring + adaptive supersampling + DE filament
// shading, perturbation for deep tiles) replaces both the GL and plain-WASM
// paths for the live view. Set false to fall back to the legacy engines.
const CRISP = true;

// Deepest zoom the deck.gl viewer is allowed to reach. The WebGL shader's
// 32-bit floats lose accuracy past ~zoom 22, so beyond GL_ACCURATE_MAX_ZOOM we
// switch to the Rust/WASM f64 renderer (good to roughly zoom ~40 before the
// tile coordinates themselves run out of mantissa). Truly unlimited zoom comes
// later via the perturbation engine + a custom high-precision viewer.
// TODO: zoom-to-infinity (Phase 3)
const MAX_ZOOM = 32;
const GL_ACCURATE_MAX_ZOOM = 22;

const WASM_AVAILABLE = typeof WebAssembly !== "undefined";

// Pick the tile renderer for the current gradient/zoom: the GL shader for the
// shallow `standard` view (fast), the Rust/WASM renderer otherwise (all the
// other gradients at any zoom, and `standard` once GL gets imprecise), and the
// pure-JS renderer only as a last resort if WASM is unavailable.
const pickEngine = (gradientFunction, zoom) => {
  if (CRISP && WASM_AVAILABLE) return "crisp";
  if (gradientFunction === "standard" && zoom < GL_ACCURATE_MAX_ZOOM) return "gl";
  return WASM_AVAILABLE ? "wasm" : "js";
};

const ENGINE_FACTORIES = {
  crisp: createTileLayerCrisp,
  gl: createTileLayerGl,
  wasm: createTileLayerRust,
  js: createTileLayerJs,
};

// Retina displays get 512-px tiles for 256-px tile bounds; capped at 2 so a
// 3× phone doesn't pay 9× the samples.
const PIXEL_RATIO =
  typeof window !== "undefined"
    ? Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1)))
    : 1;

// Atoms: Global settings
const getStateFromUrlAtom = atom(true);
const showAlertAtom = atom(false);
const toastAtom = atom(null); // string to show briefly, or null
const flyToAtom = atom(null); // { x, y, z, at } — Map flies there when it changes
const showInfoAtom = atom(false);
const glTimeAtom = atom(true);
const autoScaleMaxIterationsAtom = atom(true);

// Atoms: UI states
const libraryOpenAtom = atom(false);
const showControlsAtom = atom(false);

const mapRefAtom = atom(null);
const xAtom = atom(-0.48);
const yAtom = atom(0);
const zAtom = atom(15);
const maxIterationsAtom = atom(60);
const colorsAtom = atom({
  start: { r: 44, g: 0, b: 30, hex: "#2C001E" },
  middle: { r: 233, g: 84, b: 32, hex: "#E95420" },
  end: { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
  black: { r: 0, g: 0, b: 0, hex: "#000000" },
});
const gradientFunctionAtom = atom("standard");

// Basic hooks
export const useShowAlert = () => useAtom(showAlertAtom);
export const useToast = () => useAtom(toastAtom);
export const useFlyTo = () => useAtom(flyToAtom);
export const useAutoScaleMaxIterations = () =>
  useAtom(autoScaleMaxIterationsAtom);
export const useShowInfo = () => useAtom(showInfoAtom);
export const useLibraryOpen = () => useAtom(libraryOpenAtom);
export const useShowControls = () => useAtom(showControlsAtom);
export const useGetStateFromUrl = () => useAtom(getStateFromUrlAtom);
export const useIsMobile = () => useIsSmallScreen();
export const useMapRef = () => useAtom(mapRefAtom);
export const useGL = () => useAtom(glTimeAtom);

export const useX = () => useAtom(xAtom);
export const useY = () => useAtom(yAtom);
export const useZ = () => useAtom(zAtom);
//export const useMaxIterations = () => useAtom(maxIterationsAtom);
export const useColors = () => useAtom(colorsAtom);
export const useGradientFunction = () => useAtom(gradientFunctionAtom);

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

export const useInitialViewState = () => {
  const [searchParams] = useSearchParams();
  const [, setColors] = useColors();
  const [, setGradientFunction] = useGradientFunction();
  const [, setMaxIterations] = useMaxIterations();

  return useMemo(() => {
    const x = parseFloat(searchParams.get("x") || 0.3324769434398682);
    const y = parseFloat(searchParams.get("y") || 0.07645044256287752);
    const z = parseFloat(searchParams.get("z") || 8.383395990576519);
    const colorsFromUrl = searchParams.get("colors");
    const gradientFunctionFromUrl = searchParams.get("gradientFunction");
    const maxIterationsFromUrl = searchParams.get("maxIterations");
    if (colorsFromUrl) {
      setColors(decodeColors(colorsFromUrl));
    }
    setGradientFunction(gradientFunctionFromUrl || "standard");
    setMaxIterations(maxIterationsFromUrl || 60);

    // Clear URL parameters after parsing
    searchParams.delete("x");
    searchParams.delete("y");
    searchParams.delete("z");
    searchParams.delete("colors");
    searchParams.delete("gradientFunction");
    searchParams.delete("maxIterations");
    window.history.replaceState({}, "", "?" + searchParams.toString());

    return [
      {
        longitude: x,
        latitude: y,
        zoom: z,
        bearing: 0,
        pitch: 0,
        maxZoom: MAX_ZOOM,
      },
    ];
  }, [searchParams, setColors, setGradientFunction, setMaxIterations]);
};

// Complex hooks

export const useTileLayer = () => {
  const [maxIterations] = useMaxIterations();
  const [autoScaleIterations] = useAutoScaleMaxIterations();
  const [colors] = useColors();
  const [gradientFunction] = useGradientFunction();
  const [z] = useZ();

  // Only the engine *choice* should retrigger layer creation, not every zoom
  // event — `engine` is a stable string that flips only at the threshold.
  const engine = pickEngine(gradientFunction, z);

  // With autoscale on, the crisp engine derives iterations per tile, so the
  // changing autoscaled value must not rebuild the layer (that rebuild was the
  // "everything flashes blank when zooming" bug). Legacy engines still take
  // the global value.
  const perTile = engine === "crisp" && autoScaleIterations;
  const layerIterations = perTile ? 0 : maxIterations;

  return useMemo(() => {
    const createTileLayer = ENGINE_FACTORIES[engine] || createTileLayerRust;
    return createTileLayer({
      maxIterations: layerIterations,
      autoScaleIterations: perTile,
      colors,
      gradientFunction,
      maxZoom: MAX_ZOOM,
      pixelRatio: PIXEL_RATIO,
    });
  }, [layerIterations, perTile, colors, gradientFunction, engine]);
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
