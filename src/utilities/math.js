export function evaluateMandelbrot(x0, y0, maxIterations) {
    let x = 0.0;
    let y = 0.0;
    // Perform Mandelbrot set iterations
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let xNew = x * x - y * y + x0;
      y = 2 * x * y + y0;
      x = xNew;
  
      // If escaped
      if (x * x + y * y > 4.0) {
        // Color using pretty linear gradient
        let color = 1 - 0.01 * (iteration - Math.log2(Math.log2(x * x + y * y)));
        return color;
      }
    }
    // If failed, set color to black
    return 0;
  }