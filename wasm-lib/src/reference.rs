//! High-precision reference orbit for perturbation rendering.
//!
//! Perturbation theory (Martin 2013; Zhuoran 2022 for rebasing/BLA) renders
//! deep zooms by iterating ONE point `c_ref` at arbitrary precision and every
//! pixel as a small delta from it in plain f64. The reference orbit `Z_n` is
//! stored as f64 pairs — the pixels only ever need it at f64 precision because
//! all the "big" digits live in `c_ref`, not in `Z_n` (|Z_n| ≤ 2).
//!
//! Arithmetic here is fixed-point on `dashu_int::IBig` with `frac_bits`
//! fractional bits: |c| < 2 and |Z| ≤ 2 so an integer part of a few bits is all
//! we ever need, and fixed-point multiply is a single big-int multiply and a
//! shift. Pure Rust, no GMP, builds for wasm32.

use dashu_int::ops::BitTest;
use dashu_int::{IBig, UBig};

/// A fixed-point big number: value = `int / 2^frac_bits`.
#[derive(Clone, Debug)]
pub struct Fixed {
    pub int: IBig,
    pub frac_bits: usize,
}

impl Fixed {
    /// Parse a decimal string ("-0.7436438870371587", "1.2345e-30") into
    /// fixed point with `frac_bits` fractional bits, rounding to nearest.
    pub fn parse(s: &str, frac_bits: usize) -> Option<Fixed> {
        let s = s.trim();
        if s.is_empty() {
            return None;
        }
        let (neg, s) = match s.as_bytes()[0] {
            b'-' => (true, &s[1..]),
            b'+' => (false, &s[1..]),
            _ => (false, s),
        };
        let (mant, exp10) = match s.find(|c| c == 'e' || c == 'E') {
            Some(i) => (&s[..i], s[i + 1..].parse::<i64>().ok()?),
            None => (s, 0i64),
        };
        let mut digits = String::with_capacity(mant.len());
        let mut frac_digits: i64 = 0;
        let mut seen_dot = false;
        for ch in mant.chars() {
            match ch {
                '0'..='9' => {
                    digits.push(ch);
                    if seen_dot {
                        frac_digits += 1;
                    }
                }
                '.' if !seen_dot => seen_dot = true,
                '_' => {}
                _ => return None,
            }
        }
        if digits.is_empty() {
            return None;
        }
        let m = UBig::from_str_radix(&digits, 10).ok()?;
        let m = IBig::from(m);
        // value = m * 10^(exp10 - frac_digits)
        let e10 = exp10 - frac_digits;
        let ten = IBig::from(10u8);
        let scaled = if e10 >= 0 {
            (m * ten.pow(e10 as usize)) << frac_bits
        } else {
            let denom = ten.pow((-e10) as usize);
            let num = m << (frac_bits + 1); // one extra bit for rounding
            let q = num / denom;
            (q + IBig::from(1u8)) >> 1usize
        };
        Some(Fixed {
            int: if neg { -scaled } else { scaled },
            frac_bits,
        })
    }

    pub fn from_f64(v: f64, frac_bits: usize) -> Fixed {
        // Exact: split f64 into mantissa/exponent.
        let bits = v.to_bits();
        let sign = (bits >> 63) != 0;
        let exp = ((bits >> 52) & 0x7ff) as i64;
        let frac = bits & ((1u64 << 52) - 1);
        let (mant, e2) = if exp == 0 {
            (frac, -1074i64)
        } else {
            (frac | (1u64 << 52), exp - 1075)
        };
        let shift = e2 + frac_bits as i64;
        let m = IBig::from(mant);
        let int = if shift >= 0 {
            m << (shift as usize)
        } else {
            m >> ((-shift) as usize)
        };
        Fixed {
            int: if sign { -int } else { int },
            frac_bits,
        }
    }

    /// Nearest f64 (fine for |value| ≤ 4; deltas are computed elsewhere).
    pub fn to_f64(&self) -> f64 {
        // Keep the top ~64 significant bits then scale.
        let bits = self.int.bit_len() as i64;
        let keep = 62i64;
        if bits <= keep {
            let v: i64 = (&self.int).try_into().unwrap_or(0);
            v as f64 / 2f64.powi(self.frac_bits as i32)
        } else {
            let drop = (bits - keep) as usize;
            let top: i64 = (&self.int >> drop).try_into().unwrap_or(0);
            top as f64 * 2f64.powi(drop as i32 - self.frac_bits as i32)
        }
    }

    #[inline]
    pub fn mul(&self, o: &Fixed) -> Fixed {
        Fixed {
            int: (&self.int * &o.int) >> self.frac_bits,
            frac_bits: self.frac_bits,
        }
    }
    #[inline]
    pub fn sqr(&self) -> Fixed {
        Fixed {
            int: (&self.int * &self.int) >> self.frac_bits,
            frac_bits: self.frac_bits,
        }
    }
    #[inline]
    pub fn add(&self, o: &Fixed) -> Fixed {
        Fixed {
            int: &self.int + &o.int,
            frac_bits: self.frac_bits,
        }
    }
    #[inline]
    pub fn sub(&self, o: &Fixed) -> Fixed {
        Fixed {
            int: &self.int - &o.int,
            frac_bits: self.frac_bits,
        }
    }
    /// Multiply by 2 (a shift).
    #[inline]
    pub fn dbl(&self) -> Fixed {
        Fixed {
            int: &self.int << 1usize,
            frac_bits: self.frac_bits,
        }
    }
}

/// The reference orbit as interleaved f64 pairs `[re_0, im_0, re_1, im_1, …]`
/// for `Z_0 = 0 … Z_len`. `escaped` is true if the reference itself escaped
/// (|Z|² > 4) before `max_iterations`, in which case the orbit ends at the
/// escape iteration — pixels that run off the end rebase to n = 0.
#[derive(Clone, Debug)]
pub struct ReferenceOrbit {
    pub z: Vec<f64>,
    pub escaped: bool,
}

impl ReferenceOrbit {
    #[inline]
    pub fn len(&self) -> usize {
        self.z.len() / 2
    }
    #[inline]
    pub fn get(&self, n: usize) -> (f64, f64) {
        (self.z[2 * n], self.z[2 * n + 1])
    }
}

/// How many fractional bits the reference needs for a view whose pixel
/// spacing is `2^-zoom_bits`: enough to place `c_ref` well below the pixel
/// scale, plus headroom for the accumulated rounding over the orbit.
pub fn frac_bits_for_zoom(zoom_bits: f64) -> usize {
    (zoom_bits.max(0.0) as usize) + 96
}

/// Iterate `c_ref` (given as decimal strings) at fixed-point precision and
/// return the orbit as f64 pairs. Bailout uses radius 2 (|Z|² > 4) — the
/// reference is only a scaffold; pixel escape tests happen on `Z_n + δ_n`.
pub fn compute_reference(
    c_re: &str,
    c_im: &str,
    frac_bits: usize,
    max_iterations: u32,
) -> Option<ReferenceOrbit> {
    let cr = Fixed::parse(c_re, frac_bits)?;
    let ci = Fixed::parse(c_im, frac_bits)?;
    Some(compute_reference_fixed(&cr, &ci, max_iterations))
}

pub fn compute_reference_fixed(cr: &Fixed, ci: &Fixed, max_iterations: u32) -> ReferenceOrbit {
    let fb = cr.frac_bits;
    let mut z = Vec::with_capacity(2 * (max_iterations as usize + 1));
    let mut zr = Fixed::from_f64(0.0, fb);
    let mut zi = Fixed::from_f64(0.0, fb);
    let mut escaped = false;
    z.push(0.0);
    z.push(0.0);
    for _ in 0..max_iterations {
        let zr2 = zr.sqr();
        let zi2 = zi.sqr();
        let new_zi = zr.mul(&zi).dbl().add(ci);
        let new_zr = zr2.sub(&zi2).add(cr);
        zr = new_zr;
        zi = new_zi;
        let (fr, fi) = (zr.to_f64(), zi.to_f64());
        z.push(fr);
        z.push(fi);
        if fr * fr + fi * fi > 4.0 {
            escaped = true;
            break;
        }
    }
    ReferenceOrbit { z, escaped }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_roundtrip() {
        let f = Fixed::parse("-0.75", 128).unwrap();
        assert!((f.to_f64() + 0.75).abs() < 1e-15);
        let f = Fixed::parse("1.5e-3", 128).unwrap();
        assert!((f.to_f64() - 1.5e-3).abs() < 1e-18);
        let f = Fixed::parse("0.1234567890123456789012345678901234567890", 200).unwrap();
        assert!((f.to_f64() - 0.12345678901234568).abs() < 1e-16);
    }

    #[test]
    fn from_f64_exact() {
        for v in [0.0, 1.0, -0.5, 0.1, -1.99, 1e-30, -2.5e-20] {
            let f = Fixed::from_f64(v, 160);
            assert!((f.to_f64() - v).abs() <= v.abs() * 1e-15, "{v}");
        }
    }

    #[test]
    fn reference_matches_f64_at_shallow_precision() {
        // At a shallow location the fixed-point orbit must track plain f64
        // for a good many iterations before rounding diverges.
        let (cr, ci) = (-0.7436438870371587, 0.1318259042053119);
        let orbit = compute_reference(&format!("{cr:.17}"), &format!("{ci:.17}"), 160, 200).unwrap();
        let (mut zr, mut zi) = (0.0f64, 0.0f64);
        for n in 1..60 {
            let t = zr * zr - zi * zi + cr;
            zi = 2.0 * zr * zi + ci;
            zr = t;
            let (rr, ri) = orbit.get(n);
            assert!((rr - zr).abs() < 1e-9 && (ri - zi).abs() < 1e-9, "n={n}");
        }
    }

    #[test]
    fn reference_escapes_for_outside_point() {
        let o = compute_reference("1.0", "1.0", 128, 100).unwrap();
        assert!(o.escaped);
        assert!(o.len() < 10);
    }
}
