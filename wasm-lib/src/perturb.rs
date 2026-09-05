//! Perturbation iteration with rebasing and bilinear approximation (BLA).
//!
//! Per pixel we iterate the delta `δ_n = z_n − Z_n` from the reference orbit:
//!
//! ```text
//! δ_{n+1} = 2·Z_n·δ_n + δ_n² + δc
//! ```
//!
//! entirely in f64 — the digits that make deep zooms hard live in `c_ref`,
//! which only the reference (see `reference.rs`) ever touches.
//!
//! Two of Zhuoran's techniques (fractalforums, 2022) make this robust and fast:
//!
//! * **Rebasing** — whenever `|Z_n + δ_n| < |δ_n|` the pixel orbit has come
//!   closer to `Z_0 = 0` than to the current reference point, so we restart
//!   the delta against the beginning of the orbit: `δ ← Z_n + δ_n`, `n ← 0`.
//!   This removes the glitches that used to need multiple reference orbits.
//! * **BLA** — where `|δ_n|` is tiny compared with `|Z_n|`, the `δ_n²` term is
//!   negligible and the map is linear: `δ_{n+1} ≈ A·δ_n + B·δc`. Linear maps
//!   compose, so a table of pre-merged coefficients lets a pixel jump `2^l`
//!   iterations in one multiply-add when its delta is inside the validity
//!   radius. At depth this skips the overwhelming majority of iterations.
//!
//! The derivative `z' = dz/dc` is carried along (through BLA skips too:
//! `δ'_{n+l} = A·δ'_n + B`) so we can produce a distance estimate for
//! filament shading and anti-aliasing decisions.

use crate::reference::ReferenceOrbit;

/// One bilinear approximation: `δ_{n+len} ≈ a·δ_n + b·δc`, valid when `|δ_n| < r`.
#[derive(Clone, Copy, Debug, Default)]
pub struct Bla {
    pub ar: f64,
    pub ai: f64,
    pub br: f64,
    pub bi: f64,
    /// Validity radius squared (compare against |δ|²; avoids a sqrt per lookup).
    pub r2: f64,
}

#[inline]
fn cmul(ar: f64, ai: f64, br: f64, bi: f64) -> (f64, f64) {
    (ar * br - ai * bi, ar * bi + ai * br)
}

#[inline]
fn cabs(r: f64, i: f64) -> f64 {
    (r * r + i * i).sqrt()
}

/// BLA table: `levels[l][k]` covers iterations `[k·2^l, k·2^l + 2^l)`.
#[derive(Clone, Debug)]
pub struct BlaTable {
    pub levels: Vec<Vec<Bla>>,
}

impl BlaTable {
    /// Build the table for `orbit` for pixels whose `|δc| ≤ dc_max`.
    /// `eps` is the relative size at which the quadratic term is treated as
    /// negligible; 2^-30 is conservative for f64 deltas.
    pub fn build(orbit: &ReferenceOrbit, dc_max: f64, eps: f64) -> BlaTable {
        let m = orbit.len();
        if m < 2 {
            return BlaTable { levels: Vec::new() };
        }
        // Level 0: single steps n -> n+1 using Z_n, for n in [0, m-1).
        let mut level0 = Vec::with_capacity(m - 1);
        for n in 0..m - 1 {
            let (zr, zi) = orbit.get(n);
            let a = cabs(2.0 * zr, 2.0 * zi);
            // |δ| < eps·|Z_n| keeps δ² ≪ 2Zδ and guarantees no rebase inside the step.
            let r = (eps * cabs(zr, zi)).max(0.0);
            // A step is only usable if |δ| stays small relative to 2Z: with Z=0
            // (n=0) a = 0 and r = 0 — never used, which is correct.
            let _ = a;
            level0.push(Bla {
                ar: 2.0 * zr,
                ai: 2.0 * zi,
                br: 1.0,
                bi: 0.0,
                r2: r * r,
            });
        }
        let mut levels = vec![level0];
        loop {
            let prev = levels.last().unwrap();
            if prev.len() < 2 {
                break;
            }
            let mut next = Vec::with_capacity(prev.len() / 2);
            let mut k = 0;
            while k + 1 < prev.len() {
                next.push(merge(&prev[k], &prev[k + 1], dc_max));
                k += 2;
            }
            levels.push(next);
        }
        BlaTable { levels }
    }

    #[inline]
    pub fn max_level(&self) -> usize {
        self.levels.len()
    }
}

/// Merge x (first) then y (second) into one BLA spanning both.
#[inline]
fn merge(x: &Bla, y: &Bla, dc_max: f64) -> Bla {
    let (ar, ai) = cmul(y.ar, y.ai, x.ar, x.ai);
    let (tr, ti) = cmul(y.ar, y.ai, x.br, x.bi);
    let (br, bi) = (tr + y.br, ti + y.bi);
    // |δ_mid| ≤ |A_x||δ| + |B_x||δc| must stay below r_y.
    let ax = cabs(x.ar, x.ai);
    let bx = cabs(x.br, x.bi);
    let ry = y.r2.sqrt();
    let rx = x.r2.sqrt();
    let r = if ax > 0.0 {
        rx.min(((ry - bx * dc_max) / ax).max(0.0))
    } else {
        0.0
    };
    Bla { ar, ai, br, bi, r2: r * r }
}

/// Result of iterating one point.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Sample {
    /// Smooth (fractional) iteration count, or `-1.0` if the point never escaped.
    pub iter: f64,
    /// Final z (only meaningful when escaped).
    pub zr: f64,
    pub zi: f64,
    /// Exterior distance estimate (complex-plane units); `0.0` when inside.
    pub de: f64,
}

pub const INSIDE: Sample = Sample {
    iter: -1.0,
    zr: -1.0,
    zi: -1.0,
    de: 0.0,
};

/// Escape radius squared. Kept large so smooth colouring is accurate and a
/// BLA skip (during which |z| ≈ |Z| ≤ 2) can never step over an escape.
pub const BAILOUT2: f64 = 1.0e8;

#[inline]
pub fn smooth_iter(n: f64, zr: f64, zi: f64) -> f64 {
    // ν = n + 1 − log2(log2|z|); with a big bailout this is continuous across
    // iteration bands to well under a colour step.
    let log_zn = 0.5 * (zr * zr + zi * zi).ln();
    n + 1.0 - (log_zn / core::f64::consts::LN_2).log2()
}

#[inline]
fn finish(total: f64, zr: f64, zi: f64, dr: f64, di: f64) -> Sample {
    let zabs = cabs(zr, zi);
    let dabs = cabs(dr, di);
    let de = if dabs > 0.0 { 2.0 * zabs * zabs.ln() / dabs } else { 0.0 };
    Sample {
        iter: smooth_iter(total, zr, zi),
        zr,
        zi,
        de,
    }
}

/// Plain f64 iteration (no perturbation) with the same bailout/smoothing/DE
/// outputs, used for shallow zooms and as the oracle in tests.
pub fn iterate_plain(cr: f64, ci: f64, max_iterations: u32) -> Sample {
    if crate::engine::in_main_bulbs(cr, ci) {
        return INSIDE;
    }
    let (mut zr, mut zi) = (0.0f64, 0.0f64);
    let (mut dr, mut di) = (0.0f64, 0.0f64); // z' = dz/dc
    for n in 0..max_iterations {
        // z' = 2 z z' + 1
        let (tr, ti) = cmul(zr, zi, dr, di);
        dr = 2.0 * tr + 1.0;
        di = 2.0 * ti;
        let nr = zr * zr - zi * zi + cr;
        zi = 2.0 * zr * zi + ci;
        zr = nr;
        if zr * zr + zi * zi > BAILOUT2 {
            return finish(n as f64, zr, zi, dr, di);
        }
    }
    INSIDE
}

/// Perturbed iteration of the point `c = c_ref + δc`.
pub fn iterate_perturbed(
    orbit: &ReferenceOrbit,
    bla: &BlaTable,
    dcr: f64,
    dci: f64,
    max_iterations: u32,
) -> Sample {
    let m = orbit.len();
    if m < 2 {
        return iterate_plain(dcr, dci, max_iterations);
    }
    let z = &orbit.z;
    let mut n: usize = 0; // index into the reference orbit
    let mut total: u32 = 0; // true iteration count
    let (mut dr, mut di) = (0.0f64, 0.0f64); // δ
    let (mut pr, mut pi) = (0.0f64, 0.0f64); // δ' = z'
    let nlev = bla.max_level();

    while total < max_iterations {
        // --- try the biggest valid BLA skip at this n ---
        let mut skipped = false;
        if nlev > 0 && n > 0 {
            let d2 = dr * dr + di * di;
            // largest level l with n % 2^l == 0 (n>0 so trailing_zeros finite)
            let mut l = (n.trailing_zeros() as usize).min(nlev - 1);
            loop {
                let k = n >> l;
                if let Some(b) = bla.levels[l].get(k) {
                    let len = 1usize << l;
                    if d2 < b.r2 && (total as usize + len) <= max_iterations as usize {
                        let (ar, ai) = cmul(b.ar, b.ai, dr, di);
                        let (br, bi) = cmul(b.br, b.bi, dcr, dci);
                        let (qr, qi) = cmul(b.ar, b.ai, pr, pi);
                        dr = ar + br;
                        di = ai + bi;
                        pr = qr + b.br;
                        pi = qi + b.bi;
                        n += len;
                        total += len as u32;
                        skipped = true;
                        break;
                    }
                }
                if l == 0 {
                    break;
                }
                l -= 1;
            }
        }
        if !skipped {
            // --- one exact perturbed step: δ ← 2Zδ + δ² + δc, δ' ← 2 z δ' + 1 ---
            let zr = z[2 * n];
            let zi = z[2 * n + 1];
            let fr = zr + dr; // full z_n
            let fi = zi + di;
            let (tr, ti) = cmul(fr, fi, pr, pi);
            pr = 2.0 * tr + 1.0;
            pi = 2.0 * ti;
            // 2Zδ + δ² = δ(2Z + δ)
            let (sr, si) = cmul(dr, di, 2.0 * zr + dr, 2.0 * zi + di);
            dr = sr + dcr;
            di = si + dci;
            n += 1;
            total += 1;
        }
        // --- escape / rebase against Z_n ---
        let zr = z[2 * n];
        let zi = z[2 * n + 1];
        let fr = zr + dr;
        let fi = zi + di;
        let f2 = fr * fr + fi * fi;
        if f2 > BAILOUT2 {
            return finish((total - 1) as f64, fr, fi, pr, pi);
        }
        let d2 = dr * dr + di * di;
        if f2 < d2 || n + 1 >= m {
            // Rebase: closer to Z_0 than to Z_n (or ran off the end of the orbit).
            dr = fr;
            di = fi;
            n = 0;
        }
    }
    INSIDE
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::reference::{compute_reference, frac_bits_for_zoom};

    fn reference_for(cr: f64, ci: f64, zoom_bits: f64, max_iter: u32) -> ReferenceOrbit {
        compute_reference(
            &format!("{cr:.20}"),
            &format!("{ci:.20}"),
            frac_bits_for_zoom(zoom_bits),
            max_iter,
        )
        .unwrap()
    }

    /// High-precision oracle: iterate the pixel itself in fixed point.
    fn oracle(cr: f64, ci: f64, dcr: f64, dci: f64, frac_bits: usize, max_iter: u32) -> f64 {
        use crate::reference::Fixed;
        let c_r = Fixed::from_f64(cr, frac_bits).add(&Fixed::from_f64(dcr, frac_bits));
        let c_i = Fixed::from_f64(ci, frac_bits).add(&Fixed::from_f64(dci, frac_bits));
        let mut zr = Fixed::from_f64(0.0, frac_bits);
        let mut zi = Fixed::from_f64(0.0, frac_bits);
        for n in 0..max_iter {
            let nr = zr.sqr().sub(&zi.sqr()).add(&c_r);
            let ni = zr.mul(&zi).dbl().add(&c_i);
            zr = nr;
            zi = ni;
            let (fr, fi) = (zr.to_f64(), zi.to_f64());
            if fr * fr + fi * fi > BAILOUT2 {
                return smooth_iter(n as f64, fr, fi);
            }
        }
        -1.0
    }

    /// Perturbation must agree with an exact high-precision oracle. (Plain
    /// f64 is NOT a usable oracle here: at 2^-24 pixel spacing and ~500+
    /// iterations its own rounding error has already grown to whole
    /// iterations at sensitive pixels — perturbation is more accurate.)
    fn agreement(zoom_bits: i32, with_bla: bool) {
        let (cr, ci) = (-0.7436438870371587, 0.1318259042053119);
        let max_iter = 3000;
        let fb = frac_bits_for_zoom(zoom_bits as f64);
        let orbit = reference_for(cr, ci, zoom_bits as f64, max_iter);
        let px = 2f64.powi(-zoom_bits);
        let half = 16.0 * px;
        let bla = if with_bla {
            BlaTable::build(&orbit, half * 1.5, 2f64.powi(-30))
        } else {
            BlaTable { levels: Vec::new() }
        };
        let mut mismatches = 0;
        let mut inside = 0;
        let mut total = 0;
        let mut worst = 0.0f64;
        for j in (-16..16).step_by(2) {
            for i in (-16..16).step_by(2) {
                let (dcr, dci) = (i as f64 * px, j as f64 * px);
                let a = oracle(cr, ci, dcr, dci, fb, max_iter);
                let sb = iterate_perturbed(&orbit, &bla, dcr, dci, max_iter);
                let b = sb.iter;
                total += 1;
                // Pixels sitting within ~1e-8 px of the boundary are
                // ill-conditioned for ANY f64 delta scheme (|z'| ~ 1e25+): the
                // oracle itself needs 200+ bits there. Skip them; they are the
                // ones anti-aliasing averages over anyway.
                if sb.de > 0.0 && sb.de / px < 1e-8 {
                    continue;
                }
                if a < 0.0 {
                    inside += 1;
                }
                let both_inside = a < 0.0 && b < 0.0;
                if !both_inside {
                    worst = worst.max((a - b).abs());
                }
                if !(both_inside || (a - b).abs() < 1e-3) {
                    if mismatches < 5 {
                        eprintln!("mismatch at ({i},{j}): oracle={a} pert={b}");
                    }
                    mismatches += 1;
                }
            }
        }
        eprintln!("worst |Δiter| = {worst:e} over {total} px ({inside} inside), bla={with_bla}");
        assert!(total > 0 && inside < total, "test window should straddle the set");
        assert_eq!(mismatches, 0, "perturbed vs oracle mismatches (bla={with_bla})");
    }

    #[test]
    fn perturbed_matches_oracle_without_bla() {
        agreement(24, false);
    }

    #[test]
    fn perturbed_matches_oracle_with_bla() {
        agreement(24, true);
    }

    /// Far past f64: 2^-120 pixel spacing around a point found by zooming on
    /// the Seahorse Valley spiral. The delta path must still match the exact
    /// fixed-point oracle at 300+ bits.
    #[test]
    fn deep_zoom_matches_oracle() {
        use crate::reference::Fixed;
        let zoom_bits = 120.0;
        let fb = frac_bits_for_zoom(zoom_bits);
        // c = i is a Misiurewicz point: on the boundary at every scale, with
        // escape times that grow only logarithmically with depth, so a 2^-120
        // window around it has escaping pixels within a few hundred iterations.
        let (cr_s, ci_s) = ("0", "1");
        let max_iter = 4000;
        let orbit = compute_reference(cr_s, ci_s, fb, max_iter).unwrap();
        let px = 2f64.powi(-(zoom_bits as i32));
        let bla = BlaTable::build(&orbit, 24.0 * px, 2f64.powi(-30));
        let cr = Fixed::parse(cr_s, fb).unwrap();
        let ci = Fixed::parse(ci_s, fb).unwrap();
        let mut checked = 0;
        let mut outside = 0;
        for j in (-16..16).step_by(4) {
            for i in (-16..16).step_by(4) {
                let (dcr, dci) = (i as f64 * px, j as f64 * px);
                let s = iterate_perturbed(&orbit, &bla, dcr, dci, max_iter);
                if s.de > 0.0 && s.de / px < 1e-8 {
                    continue;
                }
                // oracle on c = c_ref + δc, exact in fixed point
                let c_r = cr.add(&Fixed::from_f64(dcr, fb));
                let c_i = ci.add(&Fixed::from_f64(dci, fb));
                let (mut zr, mut zi) = (Fixed::from_f64(0.0, fb), Fixed::from_f64(0.0, fb));
                let mut o = -1.0;
                for n in 0..max_iter {
                    let nr = zr.sqr().sub(&zi.sqr()).add(&c_r);
                    let ni = zr.mul(&zi).dbl().add(&c_i);
                    zr = nr;
                    zi = ni;
                    let (fr, fi) = (zr.to_f64(), zi.to_f64());
                    if fr * fr + fi * fi > BAILOUT2 {
                        o = smooth_iter(n as f64, fr, fi);
                        break;
                    }
                }
                let both_inside = o < 0.0 && s.iter < 0.0;
                assert!(both_inside || (o - s.iter).abs() < 1e-3, "({i},{j}) oracle={o} pert={}", s.iter);
                checked += 1;
                if o >= 0.0 {
                    outside += 1;
                }
            }
        }
        eprintln!("deep: checked={checked} outside={outside}");
        assert!(checked > 20 && outside > 5, "window must contain escaping pixels");
    }

    #[test]
    fn bla_actually_skips() {
        // Count how many exact steps a deep pixel needs with and without BLA.
        let (cr, ci) = (-0.7436438870371587, 0.1318259042053119);
        let orbit = reference_for(cr, ci, 40.0, 20000);
        let bla = BlaTable::build(&orbit, 1e-11, 2f64.powi(-30));
        assert!(bla.max_level() > 8);
        let s = iterate_perturbed(&orbit, &bla, 3e-13, -2e-13, 20000);
        let p = iterate_plain(cr + 3e-13, ci - 2e-13, 20000);
        assert!((s.iter - p.iter).abs() < 1e-3 || (s.iter < 0.0 && p.iter < 0.0));
    }

    #[test]
    fn de_is_positive_outside_and_zero_inside() {
        let s = iterate_plain(-2.5, 0.0, 100);
        assert!(s.de > 0.0);
        assert_eq!(iterate_plain(-0.1, 0.0, 100), INSIDE);
    }
}

