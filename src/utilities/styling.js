export function generateColor(value) {
    // Make sure value is in range [0, 1]
    //value = Math.max(0, Math.min(1, value));
    // Map value to color using a spectral ramp
    let r, g, b;
    if (value < 0.25) {
      r = 0;
      g = 4 * value;
      b = 1;
    } else if (value < 0.5) {
      r = 0;
      g = 1;
      b = 1 - 4 * (value - 0.25);
    } else if (value < 0.75) {
      r = 4 * (value - 0.5);
      g = 1;
      b = 0;
    } else {
      r = 1;
      g = 1 - 4 * (value - 0.75);
      b = 0;
    }
    // Return color as hexadecimal string
    //return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    return [r * 255, g * 255, b * 255];
  }
  