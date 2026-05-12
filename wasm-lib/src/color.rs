//! Colour mapping: a faithful Rust port of `src/utilities/mandelbrotUtils.js`
//! (the gradient functions + `getColor`/`lerp`) plus the "fast grayscale" path.
//!
//! Doing this in Rust means every gradient function runs at native WASM speed
//! instead of one JS call per pixel, which is what made the non-`standard`
//! gradients slow in the original app.

use core::f64::consts::PI;

#[derive(Clone, Copy, Debug)]
pub struct Rgb {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl Rgb {
    pub const fn new(r: u8, g: u8, b: u8) -> Self {
        Rgb { r, g, b }
    }
    #[inline]
    fn arr(self) -> [u8; 3] {
        [self.r, self.g, self.b]
    }
}

/// The four user-configurable colours (start → middle → end gradient, plus the
/// colour used for points inside the set).
#[derive(Clone, Copy, Debug)]
pub struct Colors {
    pub start: Rgb,
    pub middle: Rgb,
    pub end: Rgb,
    pub black: Rgb,
}

impl Colors {
    /// Decode the 12-byte layout sent from JS:
    /// `[start_r, start_g, start_b, middle_r, …, end_r, …, black_r, …]`.
    pub fn from_bytes(b: &[u8]) -> Self {
        let at = |i: usize| -> u8 { b.get(i).copied().unwrap_or(0) };
        Colors {
            start: Rgb::new(at(0), at(1), at(2)),
            middle: Rgb::new(at(3), at(4), at(5)),
            end: Rgb::new(at(6), at(7), at(8)),
            black: Rgb::new(at(9), at(10), at(11)),
        }
    }
}

/// Mirrors the gradient-function dropdown in `GradientStyling.js`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GradientFn {
    Standard,
    /// "Fast grayscale" — was the `rust` option in the original app.
    Grayscale,
    NiceGradient,
    PillarMaker,
    Log,
    Sqrt,
    Exponential,
    RandomPalette,
}

impl GradientFn {
    pub fn from_name(name: &str) -> Self {
        match name {
            "standard" => GradientFn::Standard,
            "rust" => GradientFn::Grayscale,
            "niceGradient" => GradientFn::NiceGradient,
            "pillarMaker" => GradientFn::PillarMaker,
            "log" => GradientFn::Log,
            "sqrt" => GradientFn::Sqrt,
            "exponential" => GradientFn::Exponential,
            "randomPalette" => GradientFn::RandomPalette,
            // Unknown -> behave like the app's default.
            _ => GradientFn::Standard,
        }
    }
}

// A trimmed VGA palette, matching `VGA_PALETTE` in mandelbrotUtils.js.
const VGA_PALETTE: [[u8; 3]; 16] = [
    [0x00, 0x00, 0x00],
    [0x00, 0x00, 0xaa],
    [0x00, 0xaa, 0x00],
    [0x00, 0xaa, 0xaa],
    [0xaa, 0x00, 0x00],
    [0xaa, 0x00, 0xaa],
    [0xaa, 0x55, 0x00],
    [0xaa, 0xaa, 0xaa],
    [0x55, 0x55, 0x55],
    [0x55, 0x55, 0xff],
    [0x55, 0xff, 0x55],
    [0x55, 0xff, 0xff],
    [0xff, 0x55, 0x55],
    [0xff, 0x55, 0xff],
    [0xff, 0xff, 0x55],
    [0xff, 0xff, 0xff],
];

#[inline]
fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a * (1.0 - t) + b * t
}

/// Port of `getColor(value, startColor, middleColor, endColor, minValue, maxValue)`.
/// Returns un-clamped channel values just like the JS (which relied on the
/// `Uint8ClampedArray` write to clamp); callers clamp via [`pack`].
#[inline]
fn get_color(value: f64, start: Rgb, middle: Rgb, end: Rgb, min_v: f64, max_v: f64) -> [f64; 3] {
    let mut v = (value - min_v) / (max_v - min_v);
    let (c1, c2) = if v < 0.5 {
        v *= 2.0;
        (start, middle)
    } else {
        v = 2.0 * v - 1.0;
        (middle, end)
    };
    [
        lerp(c1.r as f64, c2.r as f64, v),
        lerp(c1.g as f64, c2.g as f64, v),
        lerp(c1.b as f64, c2.b as f64, v),
    ]
}

/// Round then clamp to `[0, 255]` — the JS did `Math.round` and then let the
/// `Uint8ClampedArray` clamp.
#[inline]
fn pack(v: f64) -> u8 {
    let r = v.round();
    if r <= 0.0 {
        0
    } else if r >= 255.0 {
        255
    } else {
        r as u8
    }
}

#[inline]
fn pack3(c: [f64; 3]) -> [u8; 3] {
    [pack(c[0]), pack(c[1]), pack(c[2])]
}

/// Map an escape result to an RGB pixel.
///
/// `iterations` is `-1` for points that never escaped (inside the set), matching
/// the `[-1, -1, -1]` sentinel produced by `tileGeneration.js`; in that case
/// `zx`/`zy` are `-1.0` too (only `PillarMaker` looks at them for interior
/// points, and the original JS did the same).
#[inline]
pub fn pixel_color(
    g: GradientFn,
    zx: f64,
    zy: f64,
    iterations: i32,
    max_iterations: u32,
    colors: &Colors,
) -> [u8; 3] {
    let inside = iterations < 0;
    let max = max_iterations as f64;
    let it = iterations as f64;

    match g {
        GradientFn::Standard => {
            if inside {
                return colors.black.arr();
            }
            pack3(get_color(it / max, colors.start, colors.middle, colors.end, 0.0, 1.0))
        }
        GradientFn::Grayscale => {
            if inside {
                return [0, 0, 0];
            }
            let v = pack((it / max).clamp(0.0, 1.0) * 255.0);
            [v, v, v]
        }
        GradientFn::NiceGradient => {
            if inside {
                return colors.black.arr();
            }
            let value = ((it / max) * PI - PI / 2.0).sin();
            let value = (value + 1.0) / 2.0;
            pack3(get_color(value, colors.start, colors.middle, colors.end, 0.0, 1.0))
        }
        GradientFn::Log => {
            if inside {
                return colors.black.arr();
            }
            let value = (it + 1.0).ln() / (max + 1.0).ln();
            pack3(get_color(value, colors.start, colors.middle, colors.end, 0.0, 1.0))
        }
        GradientFn::PillarMaker => {
            // No interior special-case in the original; for inside points
            // zx = zy = -1.0 and it = -1.0, exactly as the JS produced.
            let r2 = zx * zx + zy * zy;
            let value = 1.0 - (it / max - r2.log2().log2());
            pack3(get_color(value, colors.start, colors.middle, colors.end, 1.0, 3.0))
        }
        GradientFn::Sqrt => {
            if inside {
                return colors.black.arr();
            }
            let value = (it / max).sqrt();
            pack3(get_color(value, colors.start, colors.middle, colors.end, 0.0, 1.0))
        }
        GradientFn::Exponential => {
            if inside {
                return colors.black.arr();
            }
            let value = (it / max).powi(2);
            pack3(get_color(value, colors.start, colors.middle, colors.end, 0.0, 1.0))
        }
        GradientFn::RandomPalette => {
            if inside {
                return [0, 0, 0];
            }
            VGA_PALETTE[(iterations as usize) % VGA_PALETTE.len()]
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn colors() -> Colors {
        Colors {
            start: Rgb::new(44, 0, 30),
            middle: Rgb::new(233, 84, 32),
            end: Rgb::new(255, 255, 255),
            black: Rgb::new(0, 0, 0),
        }
    }

    #[test]
    fn inside_is_black_for_standard() {
        assert_eq!(pixel_color(GradientFn::Standard, -1.0, -1.0, -1, 60, &colors()), [0, 0, 0]);
    }

    #[test]
    fn standard_endpoints() {
        let c = colors();
        // value == 0 -> start colour
        assert_eq!(pixel_color(GradientFn::Standard, 0.0, 0.0, 0, 60, &c), [44, 0, 30]);
        // value == 1 -> end colour
        assert_eq!(pixel_color(GradientFn::Standard, 0.0, 0.0, 60, 60, &c), [255, 255, 255]);
        // value == 0.5 -> middle colour
        assert_eq!(pixel_color(GradientFn::Standard, 0.0, 0.0, 30, 60, &c), [233, 84, 32]);
    }

    #[test]
    fn grayscale_ramp() {
        assert_eq!(pixel_color(GradientFn::Grayscale, 0.0, 0.0, -1, 100, &colors()), [0, 0, 0]);
        assert_eq!(pixel_color(GradientFn::Grayscale, 0.0, 0.0, 50, 100, &colors()), [128, 128, 128]);
        assert_eq!(pixel_color(GradientFn::Grayscale, 0.0, 0.0, 100, 100, &colors()), [255, 255, 255]);
    }

    #[test]
    fn random_palette_wraps() {
        assert_eq!(pixel_color(GradientFn::RandomPalette, 0.0, 0.0, 1, 60, &colors()), [0x00, 0x00, 0xaa]);
        assert_eq!(pixel_color(GradientFn::RandomPalette, 0.0, 0.0, 17, 60, &colors()), [0x00, 0x00, 0xaa]);
    }
}
