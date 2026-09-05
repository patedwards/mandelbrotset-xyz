//! WASM entry points for the Mandelbrot tile renderer used by mandelbrotset.xyz.
//!
//! The app calls [`render_tile`] (off the main thread, from a Web Worker pool)
//! to produce finished RGBA tiles for deck.gl's `BitmapLayer`. Deeper-zoom
//! engines (double-double, perturbation) land in later modules.

use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

pub mod color;
pub mod engine;
pub mod tile;
pub mod reference;
pub mod perturb;
pub mod crisp;

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

// ---------------------------------------------------------------------------
// Crisp + perturbation renderers (2026-09). See crisp.rs / perturb.rs /
// reference.rs for the maths; this is only the JS surface.
// ---------------------------------------------------------------------------

static NO_BLA: perturb::BlaTable = perturb::BlaTable { levels: Vec::new() };

fn crisp_opts(aa: u32, de_strength: f64) -> crisp::CrispOptions {
    crisp::CrispOptions {
        aa: aa.clamp(1, 4),
        de_strength: de_strength.clamp(0.0, 1.0),
        ..Default::default()
    }
}

/// Plain-f64 crisp tile: smooth colouring + adaptive `aa×aa` supersampling +
/// distance-estimate filament shading. Same bbox/pixel conventions as
/// [`render_tile`]. Use for zoom < ~40; deeper, use a [`Reference`].
#[wasm_bindgen]
pub fn render_tile_crisp(
    west: f64,
    south: f64,
    east: f64,
    north: f64,
    width: u32,
    height: u32,
    max_iterations: u32,
    gradient_function: &str,
    colors: &[u8],
    aa: u32,
    de_strength: f64,
) -> Clamped<Vec<u8>> {
    let gradient = GradientFn::from_name(gradient_function);
    let colors = Colors::from_bytes(colors);
    Clamped(crisp::render_crisp(
        west,
        south,
        east,
        north,
        width,
        height,
        max_iterations,
        gradient,
        &colors,
        crisp_opts(aa, de_strength),
        |x, y| perturb::iterate_plain(x, y, max_iterations),
    ))
}

/// A high-precision reference orbit plus its BLA table. Build one per view
/// (centre point, decimal strings) and render every tile of that view against
/// it. Workers can share the orbit: `orbit()` → postMessage → `from_orbit`.
#[wasm_bindgen]
pub struct Reference {
    orbit: reference::ReferenceOrbit,
    bla: perturb::BlaTable,
    dc_max: f64,
}

#[wasm_bindgen]
impl Reference {
    /// * `c_re`, `c_im` — the reference point as decimal strings (any length).
    /// * `zoom_bits` — log2 of 1 / pixel-spacing for the view (deck zoom +
    ///   8 for 256-px tiles); sets the fixed-point precision.
    /// * `max_iterations` — orbit length cap.
    /// * `dc_max` — largest |δc| any tile of this view will ask for (the
    ///   view's half-diagonal in plane units); bounds the BLA validity radii.
    #[wasm_bindgen(constructor)]
    pub fn new(c_re: &str, c_im: &str, zoom_bits: f64, max_iterations: u32, dc_max: f64) -> Result<Reference, JsValue> {
        let fb = reference::frac_bits_for_zoom(zoom_bits);
        let orbit = reference::compute_reference(c_re, c_im, fb, max_iterations)
            .ok_or_else(|| JsValue::from_str("Reference: could not parse c_re/c_im"))?;
        let bla = perturb::BlaTable::build(&orbit, dc_max, 2f64.powi(-30));
        Ok(Reference { orbit, bla, dc_max })
    }

    /// Rebuild from an orbit computed elsewhere (see [`Reference::orbit`]).
    pub fn from_orbit(orbit: &[f64], escaped: bool, dc_max: f64) -> Reference {
        let orbit = reference::ReferenceOrbit { z: orbit.to_vec(), escaped };
        let bla = perturb::BlaTable::build(&orbit, dc_max, 2f64.powi(-30));
        Reference { orbit, bla, dc_max }
    }

    /// Interleaved `[re, im, re, im, …]` for `Z_0 …`.
    pub fn orbit(&self) -> Vec<f64> {
        self.orbit.z.clone()
    }
    pub fn escaped(&self) -> bool {
        self.orbit.escaped
    }
    pub fn len(&self) -> usize {
        self.orbit.len()
    }
    pub fn dc_max(&self) -> f64 {
        self.dc_max
    }
    pub fn bla_levels(&self) -> usize {
        self.bla.max_level()
    }
}

/// Render a tile against a [`Reference`]. The bbox is given as f64 *deltas
/// from the reference point* (`re − c_re`, `im − c_im`), which stay exact at
/// any depth as long as the caller keeps them relative (floating origin).
#[wasm_bindgen]
pub fn render_tile_perturbed(
    reference: &Reference,
    dc_west: f64,
    dc_south: f64,
    dc_east: f64,
    dc_north: f64,
    width: u32,
    height: u32,
    max_iterations: u32,
    gradient_function: &str,
    colors: &[u8],
    aa: u32,
    de_strength: f64,
) -> Clamped<Vec<u8>> {
    let gradient = GradientFn::from_name(gradient_function);
    let colors = Colors::from_bytes(colors);
    Clamped(crisp::render_crisp(
        dc_west,
        dc_south,
        dc_east,
        dc_north,
        width,
        height,
        max_iterations,
        gradient,
        &colors,
        crisp_opts(aa, de_strength),
        |x, y| {
            // The BLA radii were bounded using dc_max; a pixel further from
            // the reference than that must not use the table.
            if x * x + y * y > reference.dc_max * reference.dc_max {
                perturb::iterate_perturbed(&reference.orbit, &NO_BLA, x, y, max_iterations)
            } else {
                perturb::iterate_perturbed(&reference.orbit, &reference.bla, x, y, max_iterations)
            }
        },
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
