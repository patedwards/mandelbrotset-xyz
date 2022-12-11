import {evaluateMandelbrot } from "./math";

export function makeMandelbrot(x, y, zoom, scale, maxIterations, colors, gradientFunction) {
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
        let [x, y, iterations] = evaluateMandelbrot(x0, y0, maxIterations);
        
        row.push([x, y, iterations]);
      }
      image.push(row);
    }
  
    return image;
  }