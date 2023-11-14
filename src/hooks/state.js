// Imports
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { atom, useAtom } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { decodeColors, encodeColors } from "../utilities/colors";
import { createTileLayer as createTileLayerJs } from "../layers/TileLayerPureJS";
import { createTileLayer as createTileLayerGl } from "../layers/TileLayerGL";
import { createTileLayer as createTileLayerRust } from "../layers/TileLayerRustWASM";

// Todo: zoom-to-infinity
const MAX_ZOOM = 25

// Atoms: Global settings
const getStateFromUrlAtom = atom(true);
const showAlertAtom = atom(false);
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
  const [colors] = useColors();
  const [gradientFunction] = useGradientFunction();
  const [createTileLayer, setCreateTileLayer] = useState(() => createTileLayerGl);

  useEffect(() => {
    setCreateTileLayer(
      gradientFunction === "standard" ? 
      () => createTileLayerGl : 
      gradientFunction === "rust" ? 
      () => createTileLayerRust :
      () => createTileLayerJs
    );
  }, [gradientFunction]);

  return useMemo(() => {
    return createTileLayer({
      maxIterations,
      colors,
      gradientFunction,
      maxZoom: MAX_ZOOM,
    });
  }, [maxIterations, colors, gradientFunction, createTileLayer]);
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
