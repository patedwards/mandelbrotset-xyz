// Imports
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { decodeColors, encodeColors } from "../utilities/colors";
import { createTileLayer } from "../utilities/deck";

// Atoms: Global settings
const getStateFromUrlAtom = atom(true);
const showAlertAtom = atom(false);
const glTimeAtom = atom(false);
const autoScaleMaxIterationsAtom = atom(true);

// Atoms: UI states
const libraryOpenAtom = atom(false);
const showControlsAtom = atom(false);

const mapRefAtom = atom(null);
const urlStateAtom = atom(null);
export const xAtom = atom(-0.45);
export const yAtom = atom(0);
export const zAtom = atom(7);
export const maxIterationsAtom = atom(60);
export const colorsAtom = atom({
  start: { r: 44, g: 0, b: 30, hex: "#2C001E" },
  middle: { r: 233, g: 84, b: 32, hex: "#E95420" },
  end: { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
});
export const gradientFunctionAtom = atom("standard");
const initialViewStateAtom = atom({
  longitude: -0.45,
  latitude: 0,
  zoom: 7,
  bearing: 0,
  pitch: 0,
});

// Basic hooks
export const useShowAlert = () => useAtom(showAlertAtom);
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
export const useGL = () => useAtom(glTimeAtom);

export const useX = () => useAtom(xAtom);
export const useY = () => useAtom(yAtom);
export const useZ = () => useAtom(zAtom);
export const useMaxIterations = () => useAtom(maxIterationsAtom);
export const useColors = () => useAtom(colorsAtom);
export const useGradientFunction = () => useAtom(gradientFunctionAtom);

export const useInitialViewState = () => useAtom(initialViewStateAtom);

export const useViewState = () => {
  const [x] = useX();
  const [y] = useY();
  const [z] = useZ();

  return [{ longitude: x, latitude: y, zoom: z ,bearing: 0, pitch: 0
    
  }];
};

export const useHandleViewStateChange = () => {
  const [, setX] = useX();
  const [, setY] = useY();
  const [, setZ] = useZ();

  return useCallback(
    ({ viewState }) => {
      setX(viewState.longitude);
      setY(viewState.latitude);
      setZ(viewState.zoom);
      const params = new URLSearchParams({
        x: String(viewState.longitude),
        y: String(viewState.latitude),
        z: String(viewState.zoom),
      });

      window.history.replaceState({}, "", "?" + params.toString());
    },
    [setX, setY, setZ]
  );
};

// Complex hooks

export const useTileLayer = () => {
  const [maxIterations] = useMaxIterations();
  const [colors] = useColors();
  const [gradientFunction] = useGradientFunction();
  const [glIsUsed] = useGL();

  return useMemo(() => {
    return createTileLayer({
      maxIterations,
      colors,
      gradientFunction,
      glIsUsed,
    });
  }, [maxIterations, colors, gradientFunction, glIsUsed]);
};

export function useURLSync() {
  const [x, setX] = useAtom(xAtom);
  const [y, setY] = useAtom(yAtom);
  const [z, setZ] = useAtom(zAtom);
  const [maxIterations, setMaxIterations] = useAtom(maxIterationsAtom);
  const [colors, setColors] = useAtom(colorsAtom);
  const [gradientFunction, setGradientFunction] = useAtom(gradientFunctionAtom);

  // On mount, set state from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setX(parseFloat(params.get("x") || x));
    setY(parseFloat(params.get("y") || y));
    setZ(parseFloat(params.get("z") || z));
    setMaxIterations(parseInt(params.get("maxIterations") || maxIterations));

    const colorsParam = params.get("colors");
    if (colorsParam) {
      const [start, middle, end] = colorsParam.split("-");
      setColors({
        start: { ...colors.start, hex: `#${start}` },
        middle: { ...colors.middle, hex: `#${middle}` },
        end: { ...colors.end, hex: `#${end}` },
      });
    }

    setGradientFunction(params.get("gradientFunction") || gradientFunction);
  }, []);

  // When state changes, update URL
  useEffect(() => {
    const params = new URLSearchParams({
      x: String(x),
      y: String(y),
      z: String(z),
      maxIterations: String(maxIterations),
      colors: `${colors.start.hex.slice(1)}-${colors.middle.hex.slice(
        1
      )}-${colors.end.hex.slice(1)}`,
      gradientFunction,
    });

    window.history.replaceState({}, "", "?" + params.toString());
  }, [x, y, z, maxIterations, colors, gradientFunction]);
}

export const useUrlStateHasLoaded = () => {
  const [urlState] = useAtom(urlStateAtom);

  // useMemo will ensure that the returned value will be stable as long as the
  // condition (urlState !== null) does not change, thus preventing unnecessary re-renders.
  return useMemo(() => urlState !== null, [urlState]);
};
