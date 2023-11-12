
const gradientFunctions = {
  // Gradient functions that incorporate the getColor logic
  standard: (x, y, iterations, maxIterations, colors) => {
    if (iterations === -1) return [colors.black.r, colors.black.g, colors.black.b]; // Black for points inside the Mandelbrot set
    let value = iterations / maxIterations;
    return getColor(value, colors.start, colors.middle, colors.end);
  },

  niceGradient: (x, y, iterations, maxIterations, colors) => {
    if (iterations === -1) return [colors.black.r, colors.black.g, colors.black.b]; // Black for points inside the Mandelbrot set
    let value =
      (Math.sin((iterations / maxIterations) * Math.PI - Math.PI / 2) + 1) / 2;
    return getColor(value, colors.start, colors.middle, colors.end, 0, 1);
  },

  log: (x, y, iterations, maxIterations, colors) => {
    if (iterations === -1) return [colors.black.r, colors.black.g, colors.black.b]; // Black for points inside the Mandelbrot set
    let value = Math.log(iterations + 1) / Math.log(maxIterations + 1);
    return getColor(value, colors.start, colors.middle, colors.end, 0, 1);
  },

  pillarMaker: (x, y, iterations, maxIterations, colors) => {
    let value =
      1 - (iterations / maxIterations - Math.log2(Math.log2(x * x + y * y)));
    return getColor(value, colors.start, colors.middle, colors.end, 1, 3);
  },

  sqrt: (x, y, iterations, maxIterations, colors) => {
    if (iterations === -1) return [colors.black.r, colors.black.g, colors.black.b]; // Black for points inside the Mandelbrot set
    let value = Math.sqrt(iterations / maxIterations);
    return getColor(value, colors.start, colors.middle, colors.end, 0, 1);
  },

  exponential: (x, y, iterations, maxIterations, colors) => {
    if (iterations === -1) return [colors.black.r, colors.black.g, colors.black.b]; // Black for points inside the Mandelbrot set{
    let value = Math.pow(iterations / maxIterations, 2);
    return getColor(value, colors.start, colors.middle, colors.end);
  },
  randomPalette: (x, y, iterations, maxIterations) => {
    if (iterations === -1) return [0, 0, 0]; // Black for points inside the Mandelbrot set
    const paletteIndex = iterations % VGA_PALETTE.length;
    return VGA_PALETTE[paletteIndex];
  },
};

const VGA_PALETTE = [
  // Here's a simple version of the VGA palette
  [0x00, 0x00, 0x00],
  [0x00, 0x00, 0xaa],
  [0x00, 0xaa, 0x00],
  [0x00, 0xaa, 0xaa],
  [0xaa, 0x00, 0x00],
  [0xaa, 0x00, 0xaa],
  [0xaa, 0x55, 0x00],
  [0xaa, 0xaa, 0xaa],
  [0x55, 0x55, 0x55],
  [0x55, 0x55, 0xff],
  [0x55, 0xff, 0x55],
  [0x55, 0xff, 0xff],
  [0xff, 0x55, 0x55],
  [0xff, 0x55, 0xff],
  [0xff, 0xff, 0x55],
  [0xff, 0xff, 0xff],
  // ... More colors can be added for full 256 palette
];

// Helper function to interpolate between two values
const lerp = (start, end, t) => start * (1 - t) + end * t;

const getColor = (
  value,
  startColor,
  middleColor,
  endColor,
  minValue = 0,
  maxValue = 1
) => {
  // Normalize the value to range [0, 1]
  value = (value - minValue) / (maxValue - minValue);

  let color1, color2;

  if (value < 0.5) {
    color1 = startColor;
    color2 = middleColor;
    value *= 2; // normalize the value for interpolation
  } else {
    color1 = middleColor;
    color2 = endColor;
    value = 2 * value - 1; // normalize the value for interpolation
  }

  let r = Math.round(lerp(color1.r, color2.r, value));
  let g = Math.round(lerp(color1.g, color2.g, value));
  let b = Math.round(lerp(color1.b, color2.b, value));

  return [r, g, b];
};

export const mandelbrotPixelTransform = (
  x,
  y,
  iterations,
  maxIterations,
  gradientFunction,
  colors
) => {
  // Call the appropriate gradient function
  if (
    [
      "standard",
      "niceGradient",
      "log",
      "pillarMaker",
      "sqrt",
      "exponential",
    ].includes(gradientFunction)
  ) {
    // For gradient functions that need colors
    return gradientFunctions[gradientFunction](
      x,
      y,
      iterations,
      maxIterations,
      colors
    );
  } else {
    // For gradient functions that directly return colors
    return gradientFunctions[gradientFunction](x, y, iterations, maxIterations);
  }
};
