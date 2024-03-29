export const vertexShader = `
  precision highp float;  // Set high precision for floating-point calculations

  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;


export const fragmentShader = `
  precision highp float;  // Set high precision for floating-point calculations

  varying vec2 vUv;
  uniform float maxIterations;
  uniform vec4 mandelbrotBounds; // minX, maxX, minY, maxY
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform vec3 colorC;
  uniform vec3 colorBlack;

  vec3 getColor(float iterations) {
    if (iterations == maxIterations) return colorBlack;

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
        vec2 z_next;
        z_next.x = (z.x * z.x - z.y * z.y) + c.x;
        z_next.y = (2.0 * z.x * z.y) + c.y;

        if (dot(z_next, z_next) > 2.0) break; 
        z = z_next;
    }

    gl_FragColor = vec4(getColor(iterations), 1.0);
}`;