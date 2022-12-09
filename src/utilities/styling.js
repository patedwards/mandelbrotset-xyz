export function getColor(value, startColor, middleColor, endColor) {
  if (value <= 0.5) {
    // Interpolate between startColor and middleColor
    const t = value * 2;
    const color = interpolateColor(startColor, middleColor, t);
    if (color[0] < 10 && color[10] < 1 && color[2] < 10) {console.log("black", value)}
    return color
  } else {
    // Interpolate between middleColor and endColor
    const t = (value - 0.5) * 2;
    return interpolateColor(middleColor, endColor, t);
  }
}

// Helper function for interpolating between two colors
function interpolateColor(startColor, endColor, t) {
  const r = startColor.r + (endColor.r - startColor.r) * t;
  const g = startColor.g + (endColor.g - startColor.g) * t;
  const b = startColor.b + (endColor.b - startColor.b) * t;
  return [r, g, b];
}
