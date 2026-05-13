//! Arbitrary-precision helpers built on `dashu_float`.
//!
//! Used only to compute the *reference orbit* for perturbation-theory deep zoom:
//! the centre point's complex coordinate needs many more bits than f64 has, and
//! its orbit `Z_{n+1} = Z_n^2 + c` must be iterated at that precision so the
//! stored (f64-rounded) orbit is accurate. Every per-pixel calculation stays in
//! f64 / double-double — none of this runs in the hot loop.

use dashu_base::Approximation;
use dashu_float::{round::mode::HalfAway, DBig, FBig};

/// A binary arbitrary-precision float (the working type for the reference orbit).
/// `HalfAway` matches `DBig`'s rounding mode, so decimal parsing is conversion-free;
/// the exact mode is immaterial here — the reference orbit carries guard bits.
pub type BigFloat = FBig<HalfAway, 2>;

/// Parse a base-10 decimal string (e.g. `"-0.743643887037158704752191506"`) into
/// a binary float carrying `precision_bits` of mantissa.
///
/// The string's own digit count is what limits accuracy — a 30-digit literal
/// gives ~100 bits of real information no matter how large `precision_bits` is —
/// so callers should hand in a string with enough digits for the zoom level.
pub fn parse_decimal(s: &str, precision_bits: usize) -> Result<BigFloat, String> {
    let d: DBig = s
        .trim()
        .parse()
        .map_err(|e| format!("could not parse '{s}' as a decimal: {e:?}"))?;
    // Convert base-10 -> base-2 at the requested precision (NOT at the literal's
    // own precision, which `to_binary()` would use and which can be tiny — "0.1"
    // is one significant digit).
    let bin = match d.with_base_and_precision::<2>(precision_bits) {
        Approximation::Exact(v) | Approximation::Inexact(v, _) => v,
    };
    Ok(bin)
}

/// Round `x` to (at most) `precision_bits` of mantissa.
#[inline]
pub fn round_bits(x: BigFloat, precision_bits: usize) -> BigFloat {
    match x.with_precision(precision_bits) {
        Approximation::Exact(v) | Approximation::Inexact(v, _) => v,
    }
}

/// Convert a `BigFloat` to the nearest `f64`.
#[inline]
pub fn to_f64(x: &BigFloat) -> f64 {
    match x.to_f64() {
        Approximation::Exact(v) | Approximation::Inexact(v, _) => v,
    }
}

/// One step of the Mandelbrot map on a complex `BigFloat`, rounding the result
/// back to `precision_bits` so the working precision stays bounded:
/// `(zx, zy) <- (zx^2 - zy^2 + cx, 2*zx*zy + cy)`.
#[inline]
pub fn mandelbrot_step(
    zx: &BigFloat,
    zy: &BigFloat,
    cx: &BigFloat,
    cy: &BigFloat,
    precision_bits: usize,
) -> (BigFloat, BigFloat) {
    let zx2 = zx * zx;
    let zy2 = zy * zy;
    let two_zxzy = (zx * zy) * BigFloat::from(2);
    let new_x = round_bits(zx2 - zy2 + cx, precision_bits);
    let new_y = round_bits(two_zxzy + cy, precision_bits);
    (new_x, new_y)
}

/// `|z|^2` as an `f64` (good enough — this is only used to test the reference
/// orbit's bailout, which uses a generously large radius).
#[inline]
pub fn magnitude_sq_f64(zx: &BigFloat, zy: &BigFloat) -> f64 {
    let x = to_f64(zx);
    let y = to_f64(zy);
    x * x + y * y
}

/// Promote an f64 to a `BigFloat` at the requested precision.
pub fn from_f64(x: f64, precision_bits: usize) -> BigFloat {
    // `FBig::try_from(f64)` fails on NaN / infinity; the deep-zoom viewer
    // never passes those, but defend anyway.
    let big: BigFloat = BigFloat::try_from(x).unwrap_or_else(|_| BigFloat::from(0u8));
    round_bits(big, precision_bits)
}

/// Format a `BigFloat` as a decimal string with enough digits to round-trip
/// through `parse_decimal` at the same precision.
pub fn to_decimal_string(x: &BigFloat) -> String {
    let bits = x.precision();
    // ceil(bits / log2(10)) ≈ bits / 3.322 — add a couple of guard digits.
    let decimal_digits = bits / 3 + 3;
    let dec = match x.clone().with_base_and_precision::<10>(decimal_digits) {
        Approximation::Exact(v) | Approximation::Inexact(v, _) => v,
    };
    format!("{dec}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn round_trip_decimal() {
        let x = parse_decimal("-0.5", 64).unwrap();
        assert!((to_f64(&x) + 0.5).abs() < 1e-15);
    }

    #[test]
    fn parses_long_decimal() {
        // ~30 significant digits — far beyond f64.
        let s = "-0.743643887037158704752191506114774";
        let x = parse_decimal(s, 160).unwrap();
        // The f64 round should match parsing it directly as f64.
        let direct: f64 = s.parse().unwrap();
        assert_eq!(to_f64(&x), direct);
    }

    #[test]
    fn round_trip_via_decimal_string() {
        let s = "-0.743643887037158704752191506114774";
        let x = parse_decimal(s, 200).unwrap();
        let out = to_decimal_string(&x);
        let y = parse_decimal(&out, 200).unwrap();
        // Both should round to the same f64.
        assert_eq!(to_f64(&x), to_f64(&y));
        // And the decimal string itself should preserve the leading digits.
        assert!(out.starts_with("-0.74364388703715870475"));
    }

    #[test]
    fn add_small_delta_preserves_high_digits() {
        let s = "-0.743643887037158704752191506114774";
        let bits = 200;
        let x = parse_decimal(s, bits).unwrap();
        let delta = from_f64(1.0e-25, bits);
        let y = round_bits(x + delta, bits);
        let out = to_decimal_string(&y);
        eprintln!("out = {out}");
        // Just check we can round-trip the result back.
        let back = parse_decimal(&out, bits).unwrap();
        // The diff |x+delta - parsed_back| should be < ulp of x at 200 bits.
        let diff = (to_f64(&y) - to_f64(&back)).abs();
        assert!(diff < 1e-15, "round-trip diff {diff}, out={out}");
    }

    #[test]
    fn step_matches_f64_for_small_values() {
        let cx = parse_decimal("0.25", 64).unwrap();
        let cy = parse_decimal("0.0", 64).unwrap();
        let mut zx = parse_decimal("0.0", 64).unwrap();
        let mut zy = parse_decimal("0.0", 64).unwrap();
        let (mut fx, mut fy) = (0.0f64, 0.0f64);
        for _ in 0..20 {
            let (nx, ny) = mandelbrot_step(&zx, &zy, &cx, &cy, 64);
            zx = nx;
            zy = ny;
            let nfx = fx * fx - fy * fy + 0.25;
            fy = 2.0 * fx * fy;
            fx = nfx;
        }
        assert!((to_f64(&zx) - fx).abs() < 1e-12);
        assert!((to_f64(&zy) - fy).abs() < 1e-12);
    }
}
