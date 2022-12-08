import {evaluateMandelbrot} from "./math";
import { generateColor } from './styling';

export function makeMandelbrot(x, y, zoom, scale, maxIterations) {
    // Calculate values to make navigation easier
    const zF = 2 ** zoom;
    const xFrom = x / zF;
    const xTo = (1 + x) / zF;
    const yFrom = y / zF;
    const yTo = (1 + y) / zF;
    const height = 256;
    const width = 256;
  
    const xs = (xTo - xFrom) / width;
    const ys = (yTo - yFrom) / height;
  
    const image = [];
    for (let j = 0; j < 256; j++) {
      let row = [];
      for (let i = 0; i < 256; i++) {
        let x0 = i * xs + xFrom;
        let y0 = j * ys + yFrom;
        let value = evaluateMandelbrot(x0, y0, maxIterations)/scale;
        let pixel = generateColor(value);
        row.push(pixel);
      }
      image.push(row);
    }
  
    return image;
  }