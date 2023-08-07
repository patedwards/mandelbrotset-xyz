import { useAtom } from "jotai";
import { atom } from "jotai";
import { useSearchParams } from "react-router-dom";

import { decodeColors } from "../utilities/colors";

const DEFAULT_MAX_ITERATIONS = 100;

// Atoms remain largely the same
const maxIterationsAtom = atom(DEFAULT_MAX_ITERATIONS);
const gradientFunctionAtom = atom("standard");
const colorsAtom = atom({
  start: { r: 35, g: 44, b: 51, hex: "#232C33" },
  middle: { r: 219, g: 62, b: 0, hex: "#db3e00" },
  end: { r: 83, g: 0, b: 235, hex: "#5300eb" },
});
const viewStateAtom = atom({
  longitude: 0,
  latitude: 0,
  zoom: 2,
  minZoom: 2,
  maxZoom: Infinity,
  bearing: 0,
  pitch: 0,
});


export const libraryOpenAtom = atom(false);
export const activeTaskAtom = atom(null);
export const showControlsAtom = atom(false);

export const useLibraryOpen = () => {
  const [libraryOpen, setLibraryOpen] = useAtom(libraryOpenAtom);
  return { libraryOpen, setLibraryOpen };
};

export const useActiveTask = () => {
  const [activeTask, setActiveTask] = useAtom(activeTaskAtom);
  return { activeTask, setActiveTask };
};

export const useShowControls = () => {
  const [showControls, setShowControls] = useAtom(showControlsAtom);
  return { showControls, setShowControls };
};
