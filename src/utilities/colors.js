function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
        hex: hex,
      }
    : null;
}

export const encodeColors = ({ start, middle, end }) => {
  return `${start.hex}-${middle.hex}-${end.hex}`.replace(/#/g, "");
};

export const decodeColors = (colors) => {
  // the colors parameter is a string like "232C33-db3e00-5300eb"
  const [start, middle, end] = colors.split("-");
  return {
    start: { hex: start, ...hexToRgb("#" + start) },
    middle: { hex: middle, ...hexToRgb("#" + middle) },
    end: { hex: end, ...hexToRgb("#" + end) },
  };
};
