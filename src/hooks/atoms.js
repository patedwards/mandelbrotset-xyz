import { atom } from "jotai";

export const colorsAtom = atom({
  start: { r: 35, g: 44, b: 51, hex: "#232C33" },
  middle: { r: 219, g: 62, b: 0, hex: "#db3e00" },
  end: { r: 83, g: 0, b: 235, hex: "#5300eb" },
});

export const viewStateAtom = atom({
  longitude: 0,
  latitude: 0,
  zoom: 2,
  minZoom: 2,
  maxZoom: Infinity,
});
