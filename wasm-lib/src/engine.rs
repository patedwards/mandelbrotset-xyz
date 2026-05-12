//! f64 Mandelbrot escape-time iteration — a direct port of `evaluateMandelbrot`
//! from `src/utilities/tileGeneration.js`, plus a cheap interior early-out.
//!
//! This is the renderer used for zoom levels deeper than the WebGL shader can
//! handle accurately (its 32-bit floats break down around zoom 24). f64 buys us
//! roughly zoom ~48 before the *coordinates themselves* run out of mantissa;
//! beyond that the perturbation engine takes over (later phase).

/// Result of iterating the Mandelbrot map for a single point.
///
/// `iterations` is `-1` when the point never escaped within `max_iterations`
/// (treated as "inside the set"), in which case `zx == zy == -1.0` — this
/// reproduces the `[-1, -1, -1]` sentinel produced by `tileGeneration.js` so the
/// gradient functions colour interior points exactly as before.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Escape {
    pub iterations: i32,
    pub zx: f64,
    pub zy: f64,
}

const INSIDE: Escape = Escape {
    iterations: -1,
    zx: -1.0,
    zy: -1.0,
};

/// True if `c` is provably inside the set (main cardioid or period-2 bulb), so
/// it can never escape regardless of the bailout radius. Pure speed-up — it
/// returns the same `INSIDE` the full iteration would.
#[inline]
fn in_main_bulbs(x: f64, y: f64) -> bool {
    // Period-2 bulb, a disc of radius 1/4 centred at (-1, 0).
    let xp1 = x + 1.0;
    if xp1 * xp1 + y * y <= 0.0625 {
        return true;
    }
    // Main cardioid.
    let xm = x - 0.25;
    let q = xm * xm + y * y;
    q * (q + xm) <= 0.25 * y * y
}

/// Escape-time iteration. Bailout is `|z|^2 > 2.0` — yes, that is escape radius
/// √2 rather than the textbook 2; it is kept identical to the existing GL and
/// pure-JS renderers so deep-zoom tiles line up seamlessly with shallow ones.
#[inline]
pub fn escape(c_re: f64, c_im: f64, max_iterations: u32) -> Escape {
    if in_main_bulbs(c_re, c_im) {
        return INSIDE;
    }
    let mut zx = 0.0f64;
    let mut zy = 0.0f64;
    let mut i: u32 = 0;
    while i < max_iterations {
        let zx_new = zx * zx - zy * zy + c_re;
        zy = 2.0 * zx * zy + c_im;
        zx = zx_new;
        if zx * zx + zy * zy > 2.0 {
            return Escape {
                iterations: i as i32,
                zx,
                zy,
            };
        }
        i += 1;
    }
    INSIDE
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn origin_is_inside() {
        assert_eq!(escape(0.0, 0.0, 1000), INSIDE);
    }

    #[test]
    fn far_point_escapes_immediately() {
        // c = (2, 2): z_1 = (2, 2), |z_1|^2 = 8 > 2 -> escapes at iteration 0.
        let e = escape(2.0, 2.0, 1000);
        assert_eq!(e.iterations, 0);
    }

    #[test]
    fn known_interior_point() {
        // (-1, 0) sits in the period-2 bulb.
        assert_eq!(escape(-1.0, 0.0, 500), INSIDE);
        assert!(in_main_bulbs(-1.0, 0.0));
    }

    #[test]
    fn early_out_matches_full_iteration() {
        // Disable the early-out by hand and confirm a cardioid point still never
        // escapes the plain loop within a generous budget.
        let mut zx = 0.0f64;
        let mut zy = 0.0f64;
        let (cx, cy) = (-0.1, 0.0); // inside the main cardioid
        assert!(in_main_bulbs(cx, cy));
        for _ in 0..5000 {
            let zx_new = zx * zx - zy * zy + cx;
            zy = 2.0 * zx * zy + cy;
            zx = zx_new;
            assert!(zx * zx + zy * zy <= 2.0);
        }
    }
}
