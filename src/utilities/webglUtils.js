import { Mesh, PlaneGeometry, Scene, ShaderMaterial } from "three";

export const setupWebGLRenderer = (
  vertexShader,
  fragmentShader,
  maxIterations,
  colors,
  bounds
) => {
  const geometry = new PlaneGeometry(2, 2);

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      maxIterations: { value: maxIterations },
      mandelbrotBounds: { value: bounds },
      colorA: { value: colors.start },
      colorB: { value: colors.middle },
      colorC: { value: colors.end },
    },
  });

  const mesh = new Mesh(geometry, material);
  const scene = new Scene();
  scene.add(mesh);

  return { scene, mesh };
};

export const createTileImage = (width, height) => {
  // Create a canvas element
  const canvas = document.createElement("canvas");
  // Set the dimensions of the canvas
  canvas.width = width;
  canvas.height = height;

  // Get the 2D rendering context of the canvas
  const ctx = canvas.getContext("2d");

  // Create a new ImageData object
  const imageData = new ImageData(width, height);
  return { ctx, imageData };
};

export const convertDataToPixels = (data, imageData, pixelTransform) => {
  // Set the pixel data of the ImageData object
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data[i].length; j++) {
      const index = (i * data[i].length + j) * 4;
      const [x, y, iterations] = data[i][j];
      const pixel = pixelTransform(x, y, iterations);
      imageData.data[index + 0] = pixel[0]; // Red channel
      imageData.data[index + 1] = pixel[1]; // Green channel
      imageData.data[index + 2] = pixel[2]; // Blue channel
      imageData.data[index + 3] = 255; // Alpha channel
    }
  }
  return imageData;
};
