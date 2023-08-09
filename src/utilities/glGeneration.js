import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
} from "three";
import { TileLayer } from "@deck.gl/geo-layers";
import { BitmapLayer } from "@deck.gl/layers";

export const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/*
Colors: return {
        start: { r: 44, g: 0, b: 30, hex: "#2C001E" },
        middle: { r: 233, g: 84, b: 32, hex: "#E95420" },
        end: { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
      };


To get the color of a pixel, we need to know the number of iterations it took to escape the Mandelbrot set. We can use GL
to calculate this for us, and then use that number to determine the color of the pixel. We can do this by using a fragment

getColor(iterations) {
  if (iterations == maxIterations) return vec3(0.0);
  return vec3(1.0, 1.0, 1.0) * (iterations / maxIterations);
}
*/

export const fragmentShader = `
  varying vec2 vUv;
  uniform float maxIterations;
  uniform vec4 mandelbrotBounds; // minX, maxX, minY, maxY

  vec3 getColor(float iterations) {
    if (iterations == maxIterations) return vec3(0.0);

    // Define colors
    vec3 colorA = vec3(0.1725490196, 0.0, 0.1176470588); // start color
    vec3 colorB = vec3(0.9137254902, 0.3294117647, 0.1254901961); // middle color
    vec3 colorC = vec3(1.0, 1.0, 1.0); // end color (white)

    float t = iterations / maxIterations;

    // If t is in the first half of the gradient
    if (t < 0.5) {
        return mix(colorA, colorB, t * 2.0);  // Multiply by 2 to adapt t to [0, 1] range
    } else {
        return mix(colorB, colorC, (t - 0.5) * 2.0);  // Subtract 0.5 to adapt t to [0, 1] range
    }
}


  void main() {
    vec2 c = mix(vec2(mandelbrotBounds.x, mandelbrotBounds.z), vec2(mandelbrotBounds.y, mandelbrotBounds.w), vUv);
    vec2 z = vec2(0.0);
    float iterations;
    for (iterations = 0.0; iterations < maxIterations; iterations++) {
      float x = (z.x * z.x - z.y * z.y) + c.x;
      float y = (2.0 * z.x * z.y) + c.y;

      if (x * x + y * y > 4.0) break; 
      z = vec2(x, y);
    }

    //gl_FragColor = vec4(mandelbrotBounds[0].y, iterations, mandelbrotBounds[0].x, 1.0);
    gl_FragColor = vec4(getColor(iterations), 1.0);
  }
`;

const renderer = new WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(256, 256);
const scene = new Scene();
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

export const createTileLayerGL = ({
  maxIterations,
  colors,
  gradientFunction,
}) => {
  return new TileLayer({
    minZoom: 0,
    maxZoom: Infinity,
    tileSize: 256,
    updateTriggers: {
      getTileData: { maxIterations, colors, gradientFunction },
    },
    async getTileData({ bbox: { west, east, south, north }, zoom }) {
      const [minX, maxX, minY, maxY] = [west, east, south, north];

      const geometry = new PlaneGeometry(2, 2);

      const material = new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          maxIterations: { value: maxIterations },
          mandelbrotBounds: { value: [minX, maxX, minY, maxY] },
        },
      });

      const mesh = new Mesh(geometry, material);
      scene.add(mesh);

      renderer.render(scene, camera);
      scene.remove(mesh);

      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const context = canvas.getContext("2d");
      context.drawImage(renderer.domElement, 0, 0);

      return canvas;
    },
    renderSubLayers: (props) => {
      const {
        bbox: { west, south, east, north },
      } = props.tile;
      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [west, south, east, north],
      });
    },
  });
};
