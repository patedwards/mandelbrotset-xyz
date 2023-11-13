// Imports
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { decodeColors, encodeColors } from "../utilities/colors";
import { createTileLayer } from "../utilities/deck";
import { colors } from "@mui/material";

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
const urlStateAtom = atom(null);
export const xAtom = atom(-0.48);
export const yAtom = atom(0);
export const zAtom = atom(5);
export const maxIterationsAtom = atom(60);
export const colorsAtom = atom({
  start: { r: 44, g: 0, b: 30, hex: "#2C001E" },
  middle: { r: 233, g: 84, b: 32, hex: "#E95420" },
  end: { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
  black: { r: 0, g: 0, b: 0, hex: "#ff0000" },
});
export const gradientFunctionAtom = atom("standard");

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
  const [autoScaleMaxIterations] = useAutoScaleMaxIterations();
  const [z] = useZ();

  return [autoScaleMaxIterations ? Math.floor(10 * z ** 2) : maxIterations, setMaxIterations]
}


export const useInitialViewState = () => {
  const [searchParams] = useSearchParams();
  const [, setColors] = useColors();
  const [, setGradientFunction] = useGradientFunction();
  const [, setMaxIterations] = useMaxIterations();

  return useMemo(() => {
    const x = parseFloat(searchParams.get("x") || -0.48);
    const y = parseFloat(searchParams.get("y") || 0);
    const z = parseFloat(searchParams.get("z") || 5);
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

    return [{ longitude: x, latitude: y, zoom: z, bearing:  0, pitch: 0, maxZoom: Infinity}];
  }, [searchParams]); // Dependency array
};

// Complex hooks

export const useTileLayer = () => {
  const [maxIterations] = useMaxIterations();
  const [colors] = useColors();
  const [gradientFunction] = useGradientFunction();
  const [glIsToggled] = useGL();
  const [z,] = useZ();

  const glIsUsed = glIsToggled && z < 30 && gradientFunction === "standard";

  return useMemo(() => {
    return createTileLayer({
      maxIterations,
      colors,
      gradientFunction,
      glIsUsed,
    });
  }, [maxIterations, colors, gradientFunction, glIsUsed]);
};

export const useUrlStateHasLoaded = () => {
  const [urlState] = useAtom(urlStateAtom);

  // useMemo will ensure that the returned value will be stable as long as the
  // condition (urlState !== null) does not change, thus preventing unnecessary re-renders.
  return useMemo(() => urlState !== null, [urlState]);
};
