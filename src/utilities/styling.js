// Helper function for interpolating between two colors
function interpolateColor(startColor, endColor, t) {
  const r = startColor.r + (endColor.r - startColor.r) * t;
  const g = startColor.g + (endColor.g - startColor.g) * t;
  const b = startColor.b + (endColor.b - startColor.b) * t;
  return [r, g, b];
}

// Helper function for converting a color from hexadecimal to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

// Helper function for converting a color from RGB to hexadecimal
function rgbToHex(rgb) {
  return (
    "#" +
    ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1)
  );
}

// Helper function for converting a color to HSL
function colorToHsl(color) {
  const r = color[0] / 255;
  const g = color[1] / 255;
  const b = color[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l;

  if (max === min) {
    h = 0;
  } else if (max === r) {
    h = 60 * (0 + (g - b) / (max - min));
  } else if (max === g) {
    h = 60 * (2 + (b - r) / (max - min));
  } else if (max === b) {
    h = 60 * (4 + (r - g) / (max - min));
  }

  if (h < 0) {
    h += 360;
  }

  l = (min + max) / 2;

  if (max === 0 || min === 1) {
    s = 0;
  } else {
    s = (max - l) / Math.min(l, 1 - l);
  }

  // Multiply l and s by 100 to get the value in the [0, 100] range
  l *= 100;
  s *= 100;

  return [h, s, l];
}
