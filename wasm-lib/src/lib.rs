//! WASM entry points for the Mandelbrot tile renderer used by mandelbrotset.xyz.
//!
//! Two renderers:
//!
//! * [`render_tile`] — direct f64 escape iteration. Used (off the main thread,
//!   from a Web Worker pool) for tiles that deck.gl's `BitmapLayer` consumes,
//!   wherever f64 has enough precision (roughly up to zoom ~40).
//! * [`make_reference_orbit`] + [`render_tile_perturbed`] — deep-zoom rendering
//!   via perturbation theory against an arbitrary-precision reference orbit, for
//!   effectively unlimited zoom. The reference orbit is computed once per
//!   viewport and reused across that viewport's tiles.

use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

mod color;
mod engine;
mod perturbation;
mod precision;
mod reference;
mod tile;

pub use reference::ReferenceOrbit;

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

/// Compute the perturbation reference orbit for a deep-zoom viewport.
///
/// * `re_decimal`, `im_decimal` — the reference point (the viewport centre) as
///   base-10 decimal strings with as many digits as the zoom needs.
/// * `max_iterations` — escape-iteration cap (also the orbit length cap).
/// * `precision_bits` — mantissa bits for the high-precision iteration; the
///   caller should pass roughly `zoom_depth_bits + 64`. Clamped to ≥ 64.
///
/// Returns a `ReferenceOrbit` handle. The caller keeps it alive, passes it to
/// [`render_tile_perturbed`] for every tile in the viewport, and calls `.free()`
/// when the viewport changes.
#[wasm_bindgen]
pub fn make_reference_orbit(
    re_decimal: &str,
    im_decimal: &str,
    max_iterations: u32,
    precision_bits: u32,
) -> Result<ReferenceOrbit, JsValue> {
    let bits = (precision_bits.max(64)) as usize;
    let cx = precision::parse_decimal(re_decimal, bits).map_err(|e| JsValue::from_str(&e))?;
    let cy = precision::parse_decimal(im_decimal, bits).map_err(|e| JsValue::from_str(&e))?;
    Ok(reference::compute(&cx, &cy, max_iterations, bits))
}

/// Render one deep-zoom tile via perturbation against `orbit`.
///
/// `delta_*` are the tile rectangle expressed as offsets from the reference
/// point (`delta = c - c_ref`) — small enough to be exact f64s. Other arguments
/// match [`render_tile`]. Returns a `Uint8ClampedArray` of `width*height*4`
/// bytes for `new ImageData(...)`.
#[wasm_bindgen]
pub fn render_tile_perturbed(
    orbit: &ReferenceOrbit,
    delta_west: f64,
    delta_south: f64,
    delta_east: f64,
    delta_north: f64,
    width: u32,
    height: u32,
    max_iterations: u32,
    gradient_function: &str,
    colors: &[u8],
) -> Clamped<Vec<u8>> {
    let gradient = GradientFn::from_name(gradient_function);
    let colors = Colors::from_bytes(colors);
    Clamped(tile::render_tile_perturbed(
        orbit.re(),
        orbit.im(),
        delta_west,
        delta_south,
        delta_east,
        delta_north,
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
