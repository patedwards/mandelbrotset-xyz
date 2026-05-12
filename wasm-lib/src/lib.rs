//! WASM entry points for the Mandelbrot tile renderer used by mandelbrotset.xyz.
//!
//! The app calls [`render_tile`] (off the main thread, from a Web Worker pool)
//! to produce finished RGBA tiles for deck.gl's `BitmapLayer`. Deeper-zoom
//! engines (double-double, perturbation) land in later modules.

use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

mod color;
mod engine;
mod tile;

use color::{Colors, GradientFn};

/// Runs once when the module is instantiated (via wasm-bindgen's `init`, which
/// `App.js` and the tile worker already call).
#[wasm_bindgen(start)]
pub fn __wasm_start() {
    console_error_panic_hook::set_once();
}

/// Render one Mandelbrot tile to an RGBA8 buffer.
///
/// * `west`, `south`, `east`, `north` — the tile rectangle in the complex plane
///   (`re ∈ [west, east]`, `im ∈ [south, north]`); these are deck.gl's
///   `tile.bbox` values.
/// * `width`, `height` — pixel size of the tile (256 in the app).
/// * `max_iterations` — escape-iteration cap.
/// * `gradient_function` — the string name used by the app
///   (`"standard"`, `"rust"`, `"niceGradient"`, `"pillarMaker"`, `"log"`,
///   `"sqrt"`, `"exponential"`, `"randomPalette"`).
/// * `colors` — 12 bytes: start RGB, middle RGB, end RGB, black RGB.
///
/// Returns a `Uint8ClampedArray` of `width * height * 4` bytes — feed it straight
/// to `new ImageData(buf, width, height)`.
#[wasm_bindgen]
pub fn render_tile(
    west: f64,
    south: f64,
    east: f64,
    north: f64,
    width: u32,
    height: u32,
    max_iterations: u32,
    gradient_function: &str,
    colors: &[u8],
) -> Clamped<Vec<u8>> {
    let gradient = GradientFn::from_name(gradient_function);
    let colors = Colors::from_bytes(colors);
    Clamped(tile::render_tile_rgba(
        west,
        south,
        east,
        north,
        width,
        height,
        max_iterations,
        gradient,
        &colors,
    ))
}

/// Single-point grayscale escape value in `[0, 1]` (`0.0` = inside the set).
/// Retained as a small parity/debugging helper; the app uses [`render_tile`].
#[wasm_bindgen]
pub fn evaluate_mandelbrot_grayscale(c_re: f64, c_im: f64, max_iterations: u32) -> f64 {
    match engine::escape(c_re, c_im, max_iterations).iterations {
        -1 => 0.0,
        n => f64::from(n) / f64::from(max_iterations),
    }
}
