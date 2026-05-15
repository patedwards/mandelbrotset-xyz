// GLSL shaders for the shallow-zoom Mandelbrot renderer.
//
// One fragment shader handles all eight gradient functions, selected by a
// `gradientId` uniform. The math is the same as the Rust gradient ports
// (`color.rs`), so GL and WASM produce visually identical tiles — the
// hand-off at the zoom threshold is seamless.
//
// `gradientId` matches the order in `src/components/GradientStyling.js`:
//   0 standard
//   1 rust (fast grayscale)
//   2 niceGradient
//   3 pillarMaker
//   4 log
//   5 sqrt
//   6 exponential
//   7 randomPalette

export const GRADIENT_IDS = {
  standard: 0,
  rust: 1,
  niceGradient: 2,
  pillarMaker: 3,
  log: 4,
  sqrt: 5,
  exponential: 6,
  randomPalette: 7,
};

export const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform float maxIterations;
uniform vec4  mandelbrotBounds;   // (minX, maxX, minY, maxY)
uniform int   gradientId;
uniform vec3  colorStart;
uniform vec3  colorMiddle;
uniform vec3  colorEnd;
uniform vec3  colorBlack;

// 16-entry VGA-ish palette, matching VGA_PALETTE in mandelbrotUtils.js.
vec3 vgaPalette(float i) {
  float k = floor(mod(i, 16.0));
  if (k < 0.5)  return vec3(0.0,         0.0,         0.0        );
  if (k < 1.5)  return vec3(0.0,         0.0,         170.0/255.0);
  if (k < 2.5)  return vec3(0.0,         170.0/255.0, 0.0        );
  if (k < 3.5)  return vec3(0.0,         170.0/255.0, 170.0/255.0);
  if (k < 4.5)  return vec3(170.0/255.0, 0.0,         0.0        );
  if (k < 5.5)  return vec3(170.0/255.0, 0.0,         170.0/255.0);
  if (k < 6.5)  return vec3(170.0/255.0,  85.0/255.0, 0.0        );
  if (k < 7.5)  return vec3(170.0/255.0, 170.0/255.0, 170.0/255.0);
  if (k < 8.5)  return vec3( 85.0/255.0,  85.0/255.0,  85.0/255.0);
  if (k < 9.5)  return vec3( 85.0/255.0,  85.0/255.0, 1.0        );
  if (k < 10.5) return vec3( 85.0/255.0, 1.0,          85.0/255.0);
  if (k < 11.5) return vec3( 85.0/255.0, 1.0,         1.0        );
  if (k < 12.5) return vec3(1.0,          85.0/255.0,  85.0/255.0);
  if (k < 13.5) return vec3(1.0,          85.0/255.0, 1.0        );
  if (k < 14.5) return vec3(1.0,         1.0,          85.0/255.0);
  return                  vec3(1.0,        1.0,         1.0        );
}

// Port of the JS getColor: blend start->middle for [minV, (minV+maxV)/2],
// middle->end for the upper half, clamping is implicit on output.
vec3 tripletColor(float value, float minV, float maxV) {
  float v = (value - minV) / (maxV - minV);
  if (v < 0.5) return mix(colorStart, colorMiddle, v * 2.0);
  return mix(colorMiddle, colorEnd, (v - 0.5) * 2.0);
}

void main() {
  vec2 c = mix(vec2(mandelbrotBounds.x, mandelbrotBounds.z),
               vec2(mandelbrotBounds.y, mandelbrotBounds.w),
               vUv);
  vec2 z = vec2(0.0);
  float iters;
  // Bailout |z|^2 > 2.0, matching engine.rs / tileGeneration.js. After the
  // update z is the escaped iterate (PillarMaker needs that).
  for (iters = 0.0; iters < maxIterations; iters += 1.0) {
    z = vec2(z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y);
    if (dot(z, z) > 2.0) break;
  }
  bool escaped = iters < maxIterations;

  vec3 color;
  if (gradientId == 1) {
    // rust (fast grayscale)
    color = escaped ? vec3(iters / maxIterations) : vec3(0.0);
  } else if (gradientId == 7) {
    // randomPalette
    color = escaped ? vgaPalette(iters) : vec3(0.0);
  } else if (gradientId == 3) {
    // pillarMaker — no interior special-case; uses the final z
    float r2 = dot(z, z);
    // log2(<=0) is undefined; guard against the (rare) case the inside loop
    // produced a tiny |z|.
    float l = log2(max(r2, 1e-30));
    float value = 1.0 - (iters / maxIterations - log2(max(l, 1e-30)));
    color = tripletColor(value, 1.0, 3.0);
  } else if (!escaped) {
    color = colorBlack;
  } else {
    float value;
    float t = iters / maxIterations;
    if (gradientId == 2) {
      value = (sin(t * 3.14159265358979 - 1.57079632679) + 1.0) * 0.5;
    } else if (gradientId == 4) {
      value = log(iters + 1.0) / log(maxIterations + 1.0);
    } else if (gradientId == 5) {
      value = sqrt(t);
    } else if (gradientId == 6) {
      value = t * t;
    } else {
      // gradientId == 0 standard (and fallback for unknown ids)
      value = t;
    }
    color = tripletColor(value, 0.0, 1.0);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;
