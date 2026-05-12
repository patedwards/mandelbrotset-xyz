//! Assemble a full tile's worth of pixels in one go.
//!
//! The whole point of the rewrite: the original `TileLayerRustWASM` crossed the
//! JS↔WASM boundary once *per pixel* (65 536 calls per 256² tile) and only
//! produced grayscale. Here Rust computes the entire tile — escape iteration and
//! colour mapping — and returns one finished RGBA buffer.

use crate::color::{self, Colors, GradientFn};
use crate::engine;
use crate::perturbation;

/// Squared escape radius used everywhere (escape radius √2 — kept identical to
/// the GL, pure-JS and direct-f64 renderers so tiles line up).
const ESCAPE_R2: f64 = 2.0;

/// Render one tile as a packed RGBA8 buffer of `width * height * 4` bytes.
///
/// Pixel layout matches the original `makeMandelbrot`: row `0` is the **north**
/// edge of the tile, columns run west→east, and that is exactly what the
/// `BitmapLayer` (`bounds: [west, south, east, north]`) expects.
pub fn render_tile_rgba(
    west: f64,
    south: f64,
    east: f64,
    north: f64,
    width: u32,
    height: u32,
    max_iterations: u32,
    gradient: GradientFn,
    colors: &Colors,
) -> Vec<u8> {
    let w = width as usize;
    let h = height as usize;
    let mut buf = vec![0u8; w * h * 4];

    let dx = (east - west) / width as f64;
    let dy = (north - south) / height as f64;
    let h_minus_1 = height as f64 - 1.0;

    for j in 0..h {
        // c_im = south + (height - 1 - j) * dy  →  j = 0 is the north edge.
        let c_im = south + (h_minus_1 - j as f64) * dy;
        let row_base = j * w * 4;
        for i in 0..w {
            let c_re = west + i as f64 * dx;
            let e = engine::escape(c_re, c_im, max_iterations);
            let [r, g, b] =
                color::pixel_color(gradient, e.zx, e.zy, e.iterations, max_iterations, colors);
            let idx = row_base + i * 4;
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = 255;
        }
    }
    buf
}

/// Render a deep-zoom tile via perturbation against a shared reference orbit.
///
/// `ref_re`/`ref_im` are the `ReferenceOrbit` arrays. `d_*` are the tile
/// rectangle expressed as offsets from the reference point `c_ref`
/// (`d = c - c_ref`); these are small enough to be exact f64s even when `c`
/// itself is far beyond f64's reach. Same pixel orientation as `render_tile_rgba`
/// (row 0 = north edge).
#[allow(clippy::too_many_arguments)]
pub fn render_tile_perturbed(
    ref_re: &[f64],
    ref_im: &[f64],
    d_west: f64,
    d_south: f64,
    d_east: f64,
    d_north: f64,
    width: u32,
    height: u32,
    max_iterations: u32,
    gradient: GradientFn,
    colors: &Colors,
) -> Vec<u8> {
    let w = width as usize;
    let h = height as usize;
    let mut buf = vec![0u8; w * h * 4];

    let dx = (d_east - d_west) / width as f64;
    let dy = (d_north - d_south) / height as f64;
    let h_minus_1 = height as f64 - 1.0;

    for j in 0..h {
        let d_im = d_south + (h_minus_1 - j as f64) * dy;
        let row_base = j * w * 4;
        for i in 0..w {
            let d_re = d_west + i as f64 * dx;
            let e = perturbation::escape(ref_re, ref_im, d_re, d_im, max_iterations, ESCAPE_R2);
            let [r, g, b] =
                color::pixel_color(gradient, e.zx, e.zy, e.iterations, max_iterations, colors);
            let idx = row_base + i * 4;
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = 255;
        }
    }
    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::color::Rgb;

    fn colors() -> Colors {
        Colors {
            start: Rgb::new(44, 0, 30),
            middle: Rgb::new(233, 84, 32),
            end: Rgb::new(255, 255, 255),
            black: Rgb::new(0, 0, 0),
        }
    }

    #[test]
    fn buffer_has_expected_size_and_opaque_alpha() {
        let buf = render_tile_rgba(-2.0, -1.0, 0.5, 1.0, 16, 16, 50, GradientFn::Standard, &colors());
        assert_eq!(buf.len(), 16 * 16 * 4);
        // Every 4th byte (alpha) must be 255.
        assert!(buf.chunks_exact(4).all(|px| px[3] == 255));
    }

    #[test]
    fn center_of_set_is_black() {
        // A tiny tile entirely around (-0.5, 0) — solidly inside the cardioid.
        let buf = render_tile_rgba(-0.55, -0.02, -0.45, 0.02, 8, 8, 100, GradientFn::Standard, &colors());
        assert!(buf.chunks_exact(4).all(|px| px[0] == 0 && px[1] == 0 && px[2] == 0));
    }
}
