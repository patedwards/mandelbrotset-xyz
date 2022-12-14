export function evaluateMandelbrot(x0, y0, maxIterations) {
  let x = 0.0;
  let y = 0.0;
  // Perform Mandelbrot set iterations
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let xNew = x * x - y * y + x0;
    y = 2 * x * y + y0;
    x = xNew;

    // If escaped
    if (x * x + y * y > 4.0) {
      return [x, y, iteration];
    }
  }
  // If failed, set color to black
  // idea-1: setting this to 0,0,0 actually makes it look black. Make this toggleable
  return [-1, -1, -1];
}

export const gradientFunctions = {
  standard: (x, y, iteration) =>
    1 - 0.01 * (iteration - Math.log2(Math.log2(x * x + y * y))),
  pillarMaker: (x, y, iteration, maxIterations) =>
    1 - (iteration / maxIterations - Math.log2(Math.log2(x * x + y * y)))
};

export const zToLatLon = z => {
  // The map will cover -1 to 1 in both dimensions
  return { longitude: 180 * z.x, latitude: 90 * z.y }
}

export const latLongToZ = ({ latitude, longitude }) => {
  // The map will cover -1 to 1 in both dimensions
  return { x: longitude/180, y: latitude/90 }
}