function evaluateMandelbrot(x0, y0, maxIterations) {
  let x = 0.0;
  let y = 0.0;
  // Perform Mandelbrot set iterations
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let xNew = x * x - y * y + x0;
    y = 2 * x * y + y0;
    x = xNew;

    // If escaped
    if (x * x + y * y > 2.0) {
      return [x, y, iteration];
    }
  }
  // If failed, set color to black
  return [-1, -1, -1];
}

export function makeMandelbrot(x, y, zoom, maxIterations) {
  const TILE_SIZE = 256;
  const height = TILE_SIZE;
  const width = TILE_SIZE;

  const lonFrom = tile2lon(x, zoom);
  const lonTo = tile2lon(x + 1, zoom);
  const latFrom = tile2lat(y + 1, zoom);
  const latTo = tile2lat(y, zoom);

  const lonStep = (lonTo - lonFrom) / width;
  const latStep = (latTo - latFrom) / height;

  const image = [];
  for (let j = 0; j < height; j++) {
    let row = [];
    for (let i = 0; i < width; i++) {
      let x0 = i * lonStep + lonFrom;
      let y0 = (height - 1 - j) * latStep + latFrom; // Inverting j here

      let [x, y, iterations] = evaluateMandelbrot(x0, y0, maxIterations);
      row.push([x, y, iterations]);
    }
    image.push(row);
  }

  return image;
}

// Convert tile coordinate to longitude
function tile2lon(x, z) {
  return (x / Math.pow(2, z)) * 360 - 180;
}

// Convert tile coordinate to latitude
function tile2lat(y, z) {
  let n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}
