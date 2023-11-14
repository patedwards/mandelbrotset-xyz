use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn evaluate_mandelbrot_grayscale(x0: f64, y0: f64, max_iterations: u32) -> f64 {
    let mut x = 0.0;
    let mut y = 0.0;

    for iteration in 0..max_iterations {
        let x_new = x * x - y * y + x0;
        y = 2.0 * x * y + y0;
        x = x_new;

        if x * x + y * y > 4.0 {
            // return a single normalized value for grayscale color
            return iteration as f64 / max_iterations as f64;
            
        }
    }

    0.0
}

// Define a static mutable buffer. Make sure it's large enough.
const BUFFER_SIZE: usize = 512 * 512 * 3; // Adjust as needed
static mut BUFFER: [f64; BUFFER_SIZE] = [0.0; BUFFER_SIZE];

#[wasm_bindgen]
pub fn get_buffer_pointer() -> *const f64 {
    let pointer: *const f64;
    unsafe {
        pointer = BUFFER.as_ptr();
    }
    pointer
}

#[wasm_bindgen]
pub fn make_mandelbrot_flat(x: u32, y: u32, zoom: u32, max_iterations: u32) -> Vec<f64> {
    let tile_size = 256;
    let total_elements = tile_size * tile_size * 3; // width * height * 3
    let mut flat_data = Vec::with_capacity(total_elements);

    let lon_from = tile2lon(x, zoom);
    let lon_to = tile2lon(x + 1, zoom);
    let lat_from = tile2lat(y + 1, zoom);
    let lat_to = tile2lat(y, zoom);

    let lon_step = (lon_to - lon_from) / tile_size as f64;
    let lat_step = (lat_to - lat_from) / tile_size as f64;

    for j in 0..tile_size {
        for i in 0..tile_size {
            let x0 = i as f64 * lon_step + lon_from;
            let y0 = (tile_size - 1 - j) as f64 * lat_step + lat_from;

            let (mut x, mut y) = (0.0, 0.0);
            let mut iteration = 0;
            while x * x + y * y <= 4.0 && iteration < max_iterations {
                let x_new = x * x - y * y + x0;
                y = 2.0 * x * y + y0;
                x = x_new;
                iteration += 1;
            }

            if iteration < max_iterations {
                flat_data.push(x);
                flat_data.push(y);
                flat_data.push(iteration as f64);
            } else {
                flat_data.push(-1.0);
                flat_data.push(-1.0);
                flat_data.push(-1.0);
            }
        }
    }

    flat_data
}

fn tile2lon(x: u32, z: u32) -> f64 {
    (x as f64 / 2f64.powi(z as i32)) * 360.0 - 180.0
}

fn tile2lat(y: u32, z: u32) -> f64 {
    let n = std::f64::consts::PI - (2.0 * std::f64::consts::PI * y as f64) / 2f64.powi(z as i32);
    180.0 / std::f64::consts::PI * (0.5 * (n.exp() - (-n).exp())).atan()
}
