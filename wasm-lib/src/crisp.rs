//! The "crisp" tile renderer: smooth colouring, adaptive supersampling and
//! distance-estimate filament shading, over any point sampler.
//!
//! Why the old tiles look rough: one sample per pixel of an integer iteration
//! count. Every iteration band is a hard edge, thin filaments show up as
//! scattered speckles (a pixel centre lands on one or it doesn't), and
//! neighbouring pixels near the boundary have unrelated colours. Three fixes:
//!
//! 1. **Smooth iteration** (`n + 1 − log2 log2 |z|`) removes banding.
//! 2. **Adaptive supersampling** — a first pass at pixel centres, then any
//!    pixel whose neighbours disagree (inside/outside flip, big iteration jump,
//!    or a distance estimate under a couple of pixels) is re-rendered as an
//!    `aa × aa` grid and the *colours* are averaged in linear light. Flat
//!    regions cost one sample; the boundary gets up to 16.
//! 3. **DE shading** — the exterior distance estimate tells us how far a pixel
//!    is from the set. Pixels within a pixel-width are darkened towards the
//!    interior colour, so filaments render as continuous dark strokes instead
//!    of aliased dust. Strength 0 disables it.

use crate::color::{self, Colors, GradientFn};
use crate::perturb::Sample;

#[derive(Clone, Copy, Debug)]
pub struct CrispOptions {
    /// Supersampling grid size for edge pixels (1 = off, 2..=4 typical).
    pub aa: u32,
    /// 0.0 = off, 1.0 = full DE darkening within one pixel of the set.
    pub de_strength: f64,
    /// Iteration-difference between neighbours that triggers supersampling.
    pub edge_threshold: f64,
}

impl Default for CrispOptions {
    fn default() -> Self {
        CrispOptions {
            aa: 2,
            de_strength: 0.6,
            edge_threshold: 1.0,
        }
    }
}

#[inline]
fn srgb_to_linear(c: f64) -> f64 {
    let c = c / 255.0;
    if c <= 0.04045 {
        c / 12.92
    } else {
        ((c + 0.055) / 1.055).powf(2.4)
    }
}

#[inline]
fn linear_to_srgb(l: f64) -> f64 {
    let c = if l <= 0.0031308 {
        l * 12.92
    } else {
        1.055 * l.powf(1.0 / 2.4) - 0.055
    };
    (c * 255.0).round().clamp(0.0, 255.0)
}

/// Colour a sample (linear RGB in [0,1]).
#[inline]
fn shade(
    s: &Sample,
    px: f64,
    gradient: GradientFn,
    max_iterations: u32,
    colors: &Colors,
    de_strength: f64,
) -> [f64; 3] {
    let rgb = color::pixel_color_f(gradient, s.zr, s.zi, s.iter, max_iterations, colors);
    let mut lin = [srgb_to_linear(rgb[0]), srgb_to_linear(rgb[1]), srgb_to_linear(rgb[2])];
    if de_strength > 0.0 && s.iter >= 0.0 {
        // t → 0 right at the set, → 1 a pixel or more away. sqrt gives a
        // softer falloff than linear.
        let t = (s.de / px).clamp(0.0, 1.0).sqrt();
        let k = 1.0 - de_strength * (1.0 - t);
        let blk = [
            srgb_to_linear(colors.black.r as f64),
            srgb_to_linear(colors.black.g as f64),
            srgb_to_linear(colors.black.b as f64),
        ];
        for c in 0..3 {
            lin[c] = blk[c] + (lin[c] - blk[c]) * k;
        }
    }
    lin
}

/// Render a `width × height` RGBA tile. `sample(x, y)` evaluates the point at
/// plane coordinates (x, y) where x runs `west..east` and y `south..north`;
/// row 0 of the output is the north edge (matches `render_tile_rgba`).
pub fn render_crisp<F>(
    west: f64,
    south: f64,
    east: f64,
    north: f64,
    width: u32,
    height: u32,
    max_iterations: u32,
    gradient: GradientFn,
    colors: &Colors,
    opts: CrispOptions,
    sample: F,
) -> Vec<u8>
where
    F: Fn(f64, f64) -> Sample,
{
    let w = width as usize;
    let h = height as usize;
    let dx = (east - west) / width as f64;
    let dy = (north - south) / height as f64;
    let px = dx.abs().max(dy.abs());
    // x of column i's centre; y of row j's centre (row 0 = north).
    let cx = |i: usize| west + (i as f64 + 0.5) * dx;
    let cy = |j: usize| north - (j as f64 + 0.5) * dy;

    // Pass 1: one sample per pixel centre.
    let mut samples: Vec<Sample> = Vec::with_capacity(w * h);
    for j in 0..h {
        let y = cy(j);
        for i in 0..w {
            samples.push(sample(cx(i), y));
        }
    }

    // Pass 2: decide which pixels need supersampling.
    let aa = opts.aa.max(1) as usize;
    let needs_aa = |j: usize, i: usize| -> bool {
        if aa <= 1 {
            return false;
        }
        let s = &samples[j * w + i];
        if s.iter >= 0.0 && s.de < 2.0 * px {
            return true;
        }
        let check = |nj: isize, ni: isize| -> bool {
            if nj < 0 || ni < 0 || nj >= h as isize || ni >= w as isize {
                return false;
            }
            let t = &samples[nj as usize * w + ni as usize];
            (s.iter < 0.0) != (t.iter < 0.0) || (s.iter - t.iter).abs() > opts.edge_threshold
        };
        check(j as isize - 1, i as isize)
            || check(j as isize + 1, i as isize)
            || check(j as isize, i as isize - 1)
            || check(j as isize, i as isize + 1)
    };

    let mut buf = vec![0u8; w * h * 4];
    let inv = 1.0 / aa as f64;
    for j in 0..h {
        for i in 0..w {
            let lin = if needs_aa(j, i) {
                let mut acc = [0.0f64; 3];
                // For odd grids the centre cell coincides with the pass-1
                // sample, so reuse it instead of evaluating it again.
                let centre = if aa % 2 == 1 { Some(aa / 2) } else { None };
                for sj in 0..aa {
                    let y = north - (j as f64 + (sj as f64 + 0.5) * inv) * dy;
                    for si in 0..aa {
                        let c = if centre == Some(sj) && centre == Some(si) {
                            shade(&samples[j * w + i], px, gradient, max_iterations, colors, opts.de_strength)
                        } else {
                            let x = west + (i as f64 + (si as f64 + 0.5) * inv) * dx;
                            let s = sample(x, y);
                            shade(&s, px, gradient, max_iterations, colors, opts.de_strength)
                        };
                        acc[0] += c[0];
                        acc[1] += c[1];
                        acc[2] += c[2];
                    }
                }
                let n = (aa * aa) as f64;
                [acc[0] / n, acc[1] / n, acc[2] / n]
            } else {
                shade(&samples[j * w + i], px, gradient, max_iterations, colors, opts.de_strength)
            };
            let idx = (j * w + i) * 4;
            buf[idx] = linear_to_srgb(lin[0]) as u8;
            buf[idx + 1] = linear_to_srgb(lin[1]) as u8;
            buf[idx + 2] = linear_to_srgb(lin[2]) as u8;
            buf[idx + 3] = 255;
        }
    }
    buf
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::color::Rgb;
    use crate::perturb::iterate_plain;

    fn colors() -> Colors {
        Colors {
            start: Rgb::new(44, 0, 30),
            middle: Rgb::new(233, 84, 32),
            end: Rgb::new(255, 255, 255),
            black: Rgb::new(0, 0, 0),
        }
    }

    #[test]
    fn size_and_alpha() {
        let buf = render_crisp(-2.0, -1.0, 0.5, 1.0, 32, 32, 100, GradientFn::Standard, &colors(), CrispOptions::default(), |x, y| iterate_plain(x, y, 100));
        assert_eq!(buf.len(), 32 * 32 * 4);
        assert!(buf.chunks_exact(4).all(|p| p[3] == 255));
    }

    #[test]
    fn interior_is_black_and_far_exterior_is_start_colour() {
        let c = colors();
        let inside = render_crisp(-0.55, -0.02, -0.45, 0.02, 4, 4, 100, GradientFn::Standard, &c, CrispOptions::default(), |x, y| iterate_plain(x, y, 100));
        assert!(inside.chunks_exact(4).all(|p| p[0] == 0 && p[1] == 0 && p[2] == 0));
        let far = render_crisp(-3.0, 2.0, -2.9, 2.1, 4, 4, 100, GradientFn::Standard, &c, CrispOptions { de_strength: 0.0, ..Default::default() }, |x, y| iterate_plain(x, y, 100));
        // escapes at iteration 0 → smooth iter slightly above 0 → near start colour
        assert!(far[0] < 60 && far[2] < 60);
    }

    #[test]
    fn aa_reduces_edge_energy() {
        // Compare a boundary-heavy tile with and without AA: the AA version
        // must have a smaller mean gradient between neighbouring pixels.
        let c = colors();
        let (w, h) = (48usize, 48usize);
        let bounds = (-0.7500, 0.1000, -0.7400, 0.1100);
        let render = |aa| render_crisp(bounds.0, bounds.1, bounds.2, bounds.3, w as u32, h as u32, 400, GradientFn::Standard, &c, CrispOptions { aa, de_strength: 0.0, edge_threshold: 1.0 }, |x, y| iterate_plain(x, y, 400));
        let energy = |b: &Vec<u8>| -> f64 {
            let mut e = 0.0;
            for j in 0..h {
                for i in 0..w - 1 {
                    let a = (j * w + i) * 4;
                    let bb = a + 4;
                    e += (b[a] as f64 - b[bb] as f64).abs();
                }
            }
            e
        };
        let e1 = energy(&render(1));
        let e3 = energy(&render(3));
        assert!(e3 < e1 * 0.9, "aa1={e1} aa3={e3}");
    }
}
