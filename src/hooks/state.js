import { useEffect } from "react";
import { atom, useAtom } from "jotai";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { decodeColors, encodeColors } from "../utilities/colors";
import { useMemo } from "react";
import { createTileLayer } from "../utilities/deck";

const DEFAULT_MAX_ITERATIONS = 60;

export const getStateFromUrlAtom = atom(true);
export const showAlertAtom = atom(false);
export const glTimeAtom = atom(false);
export const autoScaleMaxIterationsAtom = atom(true);

export const maxIterationsAtom = atom(DEFAULT_MAX_ITERATIONS);
export const gradientFunctionAtom = atom("standard");
export const colorsAtom = atom({
  start: { r: 44, g: 0, b: 30, hex: "#2C001E" },
  middle: { r: 233, g: 84, b: 32, hex: "#E95420" },
  end: { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
});
export const viewStateAtom = atom({
  longitude: -0.45,
  latitude: 0,
  zoom: 7,
  minZoom: 2,
  maxZoom: Infinity,
  bearing: 0,
  pitch: 0,
});

export const libraryOpenAtom = atom(false);
export const showControlsAtom = atom(false);

// hooks not requiring the URL for context
export const useShowAlert = () => useAtom(showAlertAtom);
export const useGlTime = () => useAtom(glTimeAtom);
export const useAutoScaleMaxIterations = () =>
  useAtom(autoScaleMaxIterationsAtom);
export const useLibraryOpen = () => useAtom(libraryOpenAtom);
export const useShowControls = () => useAtom(showControlsAtom);
export const useGetStateFromUrl = () => useAtom(getStateFromUrlAtom);

// hooks requiring the URL for context
export function useMaxIterations() {
  const [searchParams] = useSearchParams();
  const [maxIterations, setMaxIterations] = useAtom(maxIterationsAtom);

  useEffect(() => {
    const value =
      parseFloat(searchParams.get("maxIterations")) || DEFAULT_MAX_ITERATIONS;
    setMaxIterations(value);
  }, [searchParams]);

  return [maxIterations, setMaxIterations];
}

export function useGradientFunction() {
  const [searchParams] = useSearchParams();
  const [gradientFunction, setGradientFunction] = useAtom(gradientFunctionAtom);

  useEffect(() => {
    const value = searchParams.get("gradientFunction") || "standard";
    setGradientFunction(value);
  }, [searchParams]);

  return [gradientFunction, setGradientFunction];
}

export function useColors() {
  const [searchParams] = useSearchParams();
  const [colors, setColors] = useAtom(colorsAtom);

  useEffect(() => {
    const colorParam = searchParams.get("colors");
    if (colorParam) {
      setColors(decodeColors(colorParam));
    }
  }, [searchParams]);

  return [colors, setColors];
}

/*
const newViewState = {
      latitude: parseFloat(queryParams.get("y")) || 0,
      longitude: parseFloat(queryParams.get("x")) || -0.45,
      zoom: parseFloat(queryParams.get("z")) || 7,
      minZoom: 2,
      maxZoom: Infinity,
      bearing: 0,
      pitch: 0,
    };
*/
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
  }, [searchParams, getStateFromUrl, setViewState]);

  return [viewState, setViewState];
}

export const useTileLayer = () => {
  const [maxIterations] = useMaxIterations();
  const [colors] = useColors();
  const [gradientFunction] = useGradientFunction();
  return useMemo(() => {
    console.log("createTileLayer");
    return createTileLayer({ maxIterations, colors, gradientFunction });
  }, [maxIterations, colors, gradientFunction]);
};
