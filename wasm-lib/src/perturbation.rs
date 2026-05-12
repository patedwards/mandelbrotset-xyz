//! Per-pixel perturbation iteration — the deep-zoom hot loop.
//!
//! Iterating `z = z^2 + c` directly throws away all precision once `c` needs
//! more than ~15 significant digits. Instead we iterate the *difference* from a
//! shared high-precision reference orbit `Z_n` (see `reference`):
//!
//! ```text
//! delta        = c - c_ref                       (tiny, but exactly an f64)
//! epsilon_1    = delta
//! epsilon_{n+1} = epsilon_n^2 + 2 Z_n epsilon_n + delta
//! z_n          = Z_n + epsilon_n
//! ```
//!
//! `Z_n` is O(1) and lives in f64; `epsilon` and `delta` are small and live in
//! f64; so the per-pixel cost is essentially that of a normal f64 iteration,
//! while accuracy is set by the (high-precision) reference rather than by f64.
//!
//! When the perturbation grows to the size of the iterate (`|z_n| < |epsilon_n|`)
//! or runs off the end of the stored reference, we "rebase": re-express the
//! current iterate as a fresh `epsilon` against `Z_0 = 0`. This keeps the
//! expansion valid without needing a second reference orbit (Zhuoran's
//! rebasing), which avoids the classic perturbation glitches in most cases.

use crate::engine::Escape;

const INSIDE: Escape = Escape {
    iterations: -1,
    zx: -1.0,
    zy: -1.0,
};

/// Escape-time iteration for one pixel via perturbation against `ref_re`/`ref_im`
/// (a `ReferenceOrbit`'s arrays: `Z_0..Z_{len-1}`, `Z_0 = 0`, `len >= 2`).
///
/// `delta_re`/`delta_im` are `c - c_ref`. `escape_r2` is the squared bailout
/// (`2.0`, matching the rest of the app). The return value has the same shape as
/// the direct f64 engine: `iterations == -1` (with `zx == zy == -1.0`) for
/// points that never escaped.
pub fn escape(
    ref_re: &[f64],
    ref_im: &[f64],
    delta_re: f64,
    delta_im: f64,
    max_iterations: u32,
    escape_r2: f64,
) -> Escape {
    let ref_len = ref_re.len();
    debug_assert!(ref_len >= 2 && ref_len == ref_im.len());
    if max_iterations == 0 {
        return INSIDE;
    }

    // epsilon_1 = delta; z_1 = Z_1 + epsilon_1; iteration count n starts at 1.
    let mut ex = delta_re;
    let mut ey = delta_im;
    let mut ri: usize = 1; // reference index for the current iterate z_n = Z_ri + epsilon
    let mut n: u32 = 1;

    loop {
        // z_n = Z_ri + epsilon
        let zx = ref_re[ri] + ex;
        let zy = ref_im[ri] + ey;
        let z2 = zx * zx + zy * zy;
        if z2 > escape_r2 {
            // Match the direct engine, which returns the loop-body index `i`
            // that produced the first iterate exceeding bailout — i.e.
            // (iterate index) - 1. z_n is iterate n, so return n - 1.
            return Escape {
                iterations: (n - 1) as i32,
                zx,
                zy,
            };
        }
        if n >= max_iterations {
            return INSIDE;
        }

        // Rebase when the perturbation has caught up with the iterate, or when
        // we'd index past the stored reference. After rebasing, epsilon holds
        // the full z_n and the reference index restarts at 0 (Z_0 = 0); the
        // recurrence and `delta` are unchanged.
        let e2 = ex * ex + ey * ey;
        if z2 < e2 || ri + 1 >= ref_len {
            ex = zx;
            ey = zy;
            ri = 0;
        }

        // epsilon_{n+1} = epsilon^2 + 2 Z_ri epsilon + delta
        let zr = ref_re[ri];
        let zi = ref_im[ri];
        let new_ex = (ex * ex - ey * ey) + 2.0 * (zr * ex - zi * ey) + delta_re;
        let new_ey = (2.0 * ex * ey) + 2.0 * (zr * ey + zi * ex) + delta_im;
        ex = new_ex;
        ey = new_ey;
        ri += 1;
        n += 1;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::engine;
    use crate::precision;
    use crate::reference;

    fn grid_compare(
        center_re_str: &str,
        center_im_str: &str,
        center_re: f64,
        center_im: f64,
        half_span: f64,
        max_iter: u32,
        bits: usize,
        n: usize,
    ) -> (usize, usize, i32) {
        let cx = precision::parse_decimal(center_re_str, bits).unwrap();
        let cy = precision::parse_decimal(center_im_str, bits).unwrap();
        let orbit = reference::compute(&cx, &cy, max_iter, bits);

        let mut mismatches = 0usize; // |diff| > 1
        let mut total = 0usize;
        let mut worst = 0i32;
        for j in 0..n {
            for i in 0..n {
                let fr = (i as f64 / (n - 1) as f64) * 2.0 - 1.0;
                let fi = (j as f64 / (n - 1) as f64) * 2.0 - 1.0;
                let c_re = center_re + fr * half_span;
                let c_im = center_im + fi * half_span;
                let direct = engine::escape(c_re, c_im, max_iter).iterations;
                let pert = escape(
                    orbit.re(),
                    orbit.im(),
                    c_re - center_re,
                    c_im - center_im,
                    max_iter,
                    2.0,
                )
                .iterations;
                total += 1;
                let d = (direct - pert).abs();
                worst = worst.max(d);
                if d > 1 {
                    mismatches += 1;
                }
            }
        }
        (mismatches, total, worst)
    }

    /// On a low-iteration exterior patch the high-precision reference orbit and
    /// plain f64 iteration haven't diverged, so perturbation must reproduce the
    /// direct result (the odd ±1 is allowed right at an escape transition, where
    /// `z = Z + epsilon` rounds differently than `z = z^2 + c`).
    #[test]
    fn perturbed_matches_direct_shallow() {
        let (mismatches, total, worst) =
            grid_compare("1.0", "1.0", 1.0, 1.0, 0.1, 200, 120, 41);
        assert_eq!(mismatches, 0, "{mismatches}/{total} differed by >1 (worst {worst})");
    }

    /// A deep patch near a Misiurewicz point (lots of interior + near-boundary
    /// pixels iterating ~max_iter). Here the perturbation is *more* accurate than
    /// direct f64 — which has accumulated rounding error over hundreds of steps —
    /// so a small handful of boundary pixels legitimately disagree. We just check
    /// it isn't catastrophically off.
    #[test]
    fn perturbed_close_to_direct_deep() {
        let (mismatches, total, worst) = grid_compare(
            "-0.74364388703", "0.13182590421",
            -0.74364388703, 0.13182590421,
            1e-3, 600, 200, 41,
        );
        let frac = mismatches as f64 / total as f64;
        assert!(
            frac < 0.02,
            "{mismatches}/{total} ({:.2}%) differed by >1 (worst {worst})",
            frac * 100.0
        );
    }

    /// delta = 0 means "the reference point itself": epsilon stays zero forever,
    /// so the iteration just walks the stored reference orbit. For a fast-escaping
    /// exterior point that walk matches plain f64 iteration exactly.
    #[test]
    fn delta_zero_is_the_reference_point() {
        let cx = precision::parse_decimal("0.36", 80).unwrap();
        let cy = precision::parse_decimal("0.46", 80).unwrap();
        let orbit = reference::compute(&cx, &cy, 200, 80);
        let pert = escape(orbit.re(), orbit.im(), 0.0, 0.0, 200, 2.0).iterations;
        let direct = engine::escape(0.36, 0.46, 200).iterations;
        assert!(
            (pert - direct).abs() <= 1,
            "perturbation gave {pert}, direct gave {direct}"
        );
    }
}
