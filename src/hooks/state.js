// Imports
import { useEffect, useMemo } from "react";
import { atom, useAtom } from "jotai";
import { useSearchParams } from "react-router-dom";
import { decodeColors } from "../utilities/colors";
import { subscribeAtomToUrl } from "../utilities/jotaiHelpers";
import { createTileLayer } from "../utilities/deck";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

// Atoms: Global settings
const getStateFromUrlAtom = atom(true);
const showAlertAtom = atom(false);
const glTimeAtom = atom(false);
const autoScaleMaxIterationsAtom = atom(true);

// Atoms: UI states
export const libraryOpenAtom = atom(false);
export const showControlsAtom = atom(false);

// Atoms: Visualization parameters
export const maxIterationsAtom = atom(60);
export const gradientFunctionAtom = atom("standard");
export const colorsAtom = atom({
  start: { r: 44, g: 0, b: 30, hex: "#2C001E" },
  middle: { r: 233, g: 84, b: 32, hex: "#E95420" },
  end: { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
});

// Atoms: map state
export const viewStateAtom = atom({
  longitude: -0.45,
  latitude: 0,
  zoom: 7,
  minZoom: 2,
  maxZoom: Infinity,
  bearing: 0,
  pitch: 0,
});
const mapRefAtom = atom(null);

// Basic hooks
export const useShowAlert = () => useAtom(showAlertAtom);
export const useGlTime = () => useAtom(glTimeAtom);
export const useAutoScaleMaxIterations = () =>
  useAtom(autoScaleMaxIterationsAtom);
export const useLibraryOpen = () => useAtom(libraryOpenAtom);
export const useShowControls = () => useAtom(showControlsAtom);
export const useGetStateFromUrl = () => useAtom(getStateFromUrlAtom);
export const useIsMobile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return isMobile;
};
export const useMapRef = () => useAtom(mapRefAtom);

// Hooks syncing with URL
export const useColors = subscribeAtomToUrl(colorsAtom, "colors", decodeColors);
export const useGradientFunction = subscribeAtomToUrl(
  gradientFunctionAtom,
  "gradientFunction"
);
export const useMaxIterations = subscribeAtomToUrl(
  maxIterationsAtom,
  "maxIterations",
  parseInt
);

// Complex hooks
export function useViewState() {
  const [getStateFromUrl, setGetStateFromUrl] = useAtom(getStateFromUrlAtom);
  const [searchParams] = useSearchParams();
  const [viewState, setViewState] = useAtom(viewStateAtom);

  useEffect(() => {
    if (!getStateFromUrl) {
      return;
    }
    const newViewState = {
      latitude: parseFloat(searchParams.get("y")) || 0,
      longitude: parseFloat(searchParams.get("x")) || -0.45,
      zoom: parseFloat(searchParams.get("z")) || 7,
      minZoom: 2,
      maxZoom: Infinity,
      bearing: 0,
      pitch: 0,
    };
    setViewState(newViewState);
    setGetStateFromUrl(false);
  }, [searchParams, getStateFromUrl, setViewState, setGetStateFromUrl]);

  return [viewState, setViewState];
}

export const useTileLayer = () => {
  const [maxIterations] = useMaxIterations();
  const [colors] = useColors();
  const [gradientFunction] = useGradientFunction();

  useEffect(() => {
    console.log("gradientFunction", gradientFunction);
  }, [gradientFunction]);

  return useMemo(() => {
    console.log("createTileLayer");
    return createTileLayer({ maxIterations, colors, gradientFunction });
  }, [maxIterations, colors, gradientFunction]);
};

// useMaxIterations will subscribe to the URL and then
// update the maxIterations based on the URL if 
// autoScaleMaxIterations is false, otherwise it will 
// vary with the zoom level from viewState

export function useMaxIterationsNew() {
    const [autoScaleMaxIterations] = useAutoScaleMaxIterations();
    const [maxIterations, setMaxIterations] = useAtom(maxIterationsAtom);
    const [viewState] = useViewState();
    
    useEffect(() => {
        if (autoScaleMaxIterations) {
        setMaxIterations(Math.floor(viewState.zoom * 10));
        }
    }, [autoScaleMaxIterations, viewState, setMaxIterations]);
    
    return [maxIterations, setMaxIterations];
    }
