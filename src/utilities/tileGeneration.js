const TILE_SIZE = 256;
const lonCache = {};
const latCache = {};

function evaluateMandelbrot(x0, y0, maxIterations) {
  let x = 0.0, y = 0.0, xx = 0.0, yy = 0.0;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    y = 2 * x * y + y0;
    x = xx - yy + x0;
    xx = x * x;
    yy = y * y;

    if (xx + yy > 4.0) {
      return [x, y, iteration];
    }
  }

  return [-1, -1, -1];
}


export function makeMandelbrot(x, y, zoom, maxIterations) {
  
  const lonFromKey = `x:${x}-z:${zoom}`;
  const lonToKey = `x:${x + 1}-z:${zoom}`;
  const latFromKey = `y:${y + 1}-z:${zoom}`;
  const latToKey = `y:${y}-z:${zoom}`;

  const lonFrom = lonCache[lonFromKey] ?? (lonCache[lonFromKey] = tile2lon(x, zoom));
  const lonTo = lonCache[lonToKey] ?? (lonCache[lonToKey] = tile2lon(x + 1, zoom));
  const latFrom = latCache[latFromKey] ?? (latCache[latFromKey] = tile2lat(y + 1, zoom));
  const latTo = latCache[latToKey] ?? (latCache[latToKey] = tile2lat(y, zoom));

  const lonStep = (lonTo - lonFrom) / TILE_SIZE;
  const latStep = (latTo - latFrom) / TILE_SIZE;

  const image = [];
  for (let j = 0; j < TILE_SIZE; j++) {
    let row = [];
    for (let i = 0; i < TILE_SIZE; i++) {
      let x0 = i * lonStep + lonFrom;
      let y0 = (TILE_SIZE - 1 - j) * latStep + latFrom; // Inverting j here

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
