// Imports
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { decodeColors, encodeColors } from "../utilities/colors";
import { createTileLayer } from "../utilities/deck";

const DEFAULT_URL_STATE = {
  x: -0.45,
  y: 0,
  z: 7,
  maxIterations: 60,
  colors: {
    start: { r: 44, g: 0, b: 30, hex: "#2C001E" },
    middle: { r: 233, g: 84, b: 32, hex: "#E95420" },
    end: { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
  },
  gradientFunction: "standard",
};

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
export const useUrlState = () => useAtom(urlStateAtom);

// Hooks syncing with URL
const createUrlStateHook = (key) => {
  return () => {
    const [urlState, setUrlState] = useAtom(urlStateAtom);
    const set = (newValue) => {
      setUrlState((prevState) => ({ ...prevState, [key]: newValue }));
    };
    return [urlState[key], set];
  };
};

export const useX = createUrlStateHook("x");
export const useY = createUrlStateHook("y");
export const useZ = createUrlStateHook("z");

export const useMaxIterations = () => {
  const [urlState, setUrlState] = useAtom(urlStateAtom);
  const [glIsUsed] = useGL();
  const [autoScaleMaxIterations] = useAutoScaleMaxIterations();

  const setMaxIterations = useCallback(
    (newMaxIterations) => {
      setUrlState((prevState) => ({
        ...prevState,
        maxIterations: newMaxIterations,
      }));
    },
    [setUrlState]
  ); // dependencies array

  useEffect(() => {
    if (autoScaleMaxIterations) {
      const idealMaxIterations = glIsUsed
        ? Math.floor(60 + urlState.z * 50)
        : Math.floor(60 + urlState.z * 30);
      // if the current maxIterations isn't within the ideal by 30%
      // then set it to the ideal
      if (
        urlState.maxIterations < idealMaxIterations * 0.7 ||
        urlState.maxIterations > idealMaxIterations * 1.3
      ) {
        setMaxIterations(idealMaxIterations);
      }
    }
  }, [
    urlState.z,
    autoScaleMaxIterations,
    glIsUsed,
    urlState.maxIterations,
    setMaxIterations,
  ]);

  return [urlState.maxIterations, setMaxIterations];
};

export const useColors = () => {
  const [urlState, setUrlState] = useAtom(urlStateAtom);

  const setColors = (newColors) => {
    setUrlState((prevState) => ({ ...prevState, colors: newColors }));
  };

  return [urlState.colors, setColors];
};

export const useGradientFunction = () => {
  const [urlState, setUrlState] = useAtom(urlStateAtom);

  const setGradientFunction = (newGradientFunction) => {
    setUrlState((prevState) => ({
      ...prevState,
      gradientFunction: newGradientFunction,
    }));
  };

  return [urlState.gradientFunction, setGradientFunction];
};

// Complex hooks

export const useGL = () => {
  const [glTime, setGLTime] = useAtom(glTimeAtom);
  const [urlState] = useUrlState();

  useEffect(() => {
    // toggle the use of GL based on zoom level
    // Here, as an example, GL is used when zoom is greater than 5
    if (urlState.z < 21) {
      setGLTime(true);
    } else {
      setGLTime(false);
    }
  }, [urlState.z, setGLTime]);

  return [glTime, setGLTime];
};

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

export const useSyncStateWithUrl = () => {
  const [urlState, setUrlState] = useAtom(urlStateAtom);
  const [getStateFromUrl, setGetStateFromUrl] = useAtom(getStateFromUrlAtom);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const noParameters = searchParams.toString() === "";

    if (getStateFromUrl) {
      const newX =
        searchParams.get("x") !== null
          ? parseFloat(searchParams.get("x"))
          : DEFAULT_URL_STATE.x;
      const newY =
        searchParams.get("y") !== null
          ? parseFloat(searchParams.get("y"))
          : DEFAULT_URL_STATE.y;
      const newZ =
        searchParams.get("z") !== null
          ? parseFloat(searchParams.get("z"))
          : DEFAULT_URL_STATE.z;

      const newColors =
        searchParams.get("colors") !== null
          ? decodeColors(searchParams.get("colors"))
          : DEFAULT_URL_STATE.colors;

      const newState = {
        x: newX,
        y: newY,
        z: newZ,
        maxIterations:
          searchParams.get("maxIterations") || DEFAULT_URL_STATE.maxIterations,
        colors: newColors,
        gradientFunction:
          searchParams.get("gradientFunction") ||
          DEFAULT_URL_STATE.gradientFunction,
      };

      setUrlState(newState);
      setGetStateFromUrl(false);
    } else if (noParameters) {
      setUrlState(DEFAULT_URL_STATE);
      setGetStateFromUrl(false);
    }
  }, [getStateFromUrl, searchParams, setGetStateFromUrl, setUrlState]);

  useEffect(() => {
    if (!getStateFromUrl) {
      setSearchParams({
        x: urlState.x.toString(),
        y: urlState.y.toString(),
        z: urlState.z.toString(),
        maxIterations: urlState.maxIterations.toString(),
        colors: encodeColors(urlState.colors),
        gradientFunction: urlState.gradientFunction,
      });
    }
  }, [
    getStateFromUrl,
    urlState,
    setSearchParams,
    setUrlState,
    setGetStateFromUrl,
  ]);
};

export const useUrlStateHasLoaded = () => {
  const [urlState] = useAtom(urlStateAtom);

  // useMemo will ensure that the returned value will be stable as long as the
  // condition (urlState !== null) does not change, thus preventing unnecessary re-renders.
  return useMemo(() => urlState !== null, [urlState]);
};
