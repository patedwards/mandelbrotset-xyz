//! The high-precision reference orbit used by perturbation-theory deep zoom.
//!
//! `Z_{n+1} = Z_n^2 + c_ref` is iterated at arbitrary precision (so the stored
//! orbit is accurate), then each `Z_n` is kept as an f64 pair. One reference
//! orbit is shared by every pixel in a viewport; the per-pixel work (in
//! `perturbation`) is all f64.

use wasm_bindgen::prelude::*;

use crate::precision::{self, BigFloat};

/// Stop iterating once `|Z|^2` exceeds this. Generously large, so the orbit
/// stays long even for a centre point that lies slightly outside the set.
const REFERENCE_BAILOUT_SQ: f64 = 1.0e10;

/// `Z_0, Z_1, … Z_{len-1}` of the reference point's orbit, as f64 pairs
/// (`Z_0 = 0`). `len >= 2` always. The arrays are read by `perturbation::escape`.
#[wasm_bindgen]
pub struct ReferenceOrbit {
    re: Vec<f64>,
    im: Vec<f64>,
    escaped: bool,
}

#[wasm_bindgen]
impl ReferenceOrbit {
    /// Number of stored iterates.
    #[wasm_bindgen(getter)]
    pub fn length(&self) -> usize {
        self.re.len()
    }

    /// Whether the reference point's own orbit diverged before `max_iterations`
    /// (a hint that a longer-orbit reference would render the view better).
    #[wasm_bindgen(getter)]
    pub fn escaped(&self) -> bool {
        self.escaped
    }
}

impl ReferenceOrbit {
    #[inline]
    pub fn re(&self) -> &[f64] {
        &self.re
    }
    #[inline]
    pub fn im(&self) -> &[f64] {
        &self.im
    }
}

/// Compute the reference orbit for `c_ref = (cx, cy)` at `precision_bits`,
/// for up to `max_iterations` steps (or until it clearly diverges).
pub fn compute(
    cx: &BigFloat,
    cy: &BigFloat,
    max_iterations: u32,
    precision_bits: usize,
) -> ReferenceOrbit {
    let cap = (max_iterations as usize).saturating_add(1).max(2);
    let mut re = Vec::with_capacity(cap);
    let mut im = Vec::with_capacity(cap);

    let mut zx = BigFloat::from(0u8);
    let mut zy = BigFloat::from(0u8);
    // Z_0 = 0
    re.push(0.0);
    im.push(0.0);

    let mut escaped = false;
    for _ in 0..max_iterations {
        let (nx, ny) = precision::mandelbrot_step(&zx, &zy, cx, cy, precision_bits);
        zx = nx;
        zy = ny;
        re.push(precision::to_f64(&zx));
        im.push(precision::to_f64(&zy));
        if precision::magnitude_sq_f64(&zx, &zy) > REFERENCE_BAILOUT_SQ {
            escaped = true;
            break;
        }
    }

    // Guarantee len >= 2 (degenerate max_iterations == 0).
    if re.len() < 2 {
        re.push(precision::to_f64(cx));
        im.push(precision::to_f64(cy));
    }

    ReferenceOrbit { re, im, escaped }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn z0_is_zero_and_z1_is_cref() {
        let cx = precision::parse_decimal("-0.75", 80).unwrap();
        let cy = precision::parse_decimal("0.1", 80).unwrap();
        let orbit = compute(&cx, &cy, 50, 80);
        assert!(orbit.re().len() >= 2);
        assert_eq!(orbit.re()[0], 0.0);
        assert_eq!(orbit.im()[0], 0.0);
        assert!((orbit.re()[1] - (-0.75)).abs() < 1e-14);
        assert!((orbit.im()[1] - 0.1).abs() < 1e-14);
    }

    #[test]
    fn outside_point_escapes() {
        let cx = precision::parse_decimal("1.0", 64).unwrap();
        let cy = precision::parse_decimal("1.0", 64).unwrap();
        let orbit = compute(&cx, &cy, 1000, 64);
        assert!(orbit.escaped);
        assert!(orbit.re().len() < 1001);
    }

    #[test]
    fn interior_point_runs_to_max() {
        let cx = precision::parse_decimal("-0.5", 64).unwrap();
        let cy = precision::parse_decimal("0.0", 64).unwrap();
        let orbit = compute(&cx, &cy, 200, 64);
        assert!(!orbit.escaped);
        assert_eq!(orbit.re().len(), 201);
    }
}
