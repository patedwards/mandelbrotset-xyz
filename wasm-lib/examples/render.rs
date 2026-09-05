//! Native smoke test / visual check: `cargo run --release --example render`.
//! Writes PPMs to /tmp: old renderer vs crisp at a shallow zoom, and a deep
//! perturbed render (2^-150 pixel spacing) around a Misiurewicz point that
//! we locate ourselves with Newton's method in fixed point.

use std::fs::File;
use std::io::Write;
use std::time::Instant;

use wasm_lib::color::{Colors, GradientFn, Rgb};
use wasm_lib::crisp::{render_crisp, CrispOptions};
use wasm_lib::perturb::{iterate_perturbed, iterate_plain, BlaTable};
use wasm_lib::reference::{compute_reference_fixed, frac_bits_for_zoom, Fixed};
use wasm_lib::tile::render_tile_rgba;

fn write_ppm(path: &str, rgba: &[u8], w: u32, h: u32) {
    let mut f = File::create(path).unwrap();
    write!(f, "P6\n{w} {h}\n255\n").unwrap();
    let rgb: Vec<u8> = rgba.chunks_exact(4).flat_map(|p| [p[0], p[1], p[2]]).collect();
    f.write_all(&rgb).unwrap();
}

fn colors() -> Colors {
    Colors {
        start: Rgb::new(44, 0, 30),
        middle: Rgb::new(233, 84, 32),
        end: Rgb::new(255, 255, 255),
        black: Rgb::new(0, 0, 0),
    }
}

/// Newton-refine a Misiurewicz point M_{n,p}: solve f^{n+p}(c) = f^n(c),
/// tracking dz/dc, in fixed point. `c0` is an f64 seed.
fn misiurewicz(c0: (f64, f64), n: usize, p: usize, fb: usize) -> (Fixed, Fixed) {
    let mut cr = Fixed::from_f64(c0.0, fb);
    let mut ci = Fixed::from_f64(c0.1, fb);
    let one = Fixed::from_f64(1.0, fb);
    let zero = Fixed::from_f64(0.0, fb);
    for _ in 0..200 {
        let (mut zr, mut zi) = (zero.clone(), zero.clone());
        let (mut dr, mut di) = (zero.clone(), zero.clone());
        let mut zn = (zero.clone(), zero.clone());
        let mut dn = (zero.clone(), zero.clone());
        for k in 0..n + p {
            // d ← 2 z d + 1
            let ndr = zr.mul(&dr).sub(&zi.mul(&di)).dbl().add(&one);
            let ndi = zr.mul(&di).add(&zi.mul(&dr)).dbl();
            let nzr = zr.sqr().sub(&zi.sqr()).add(&cr);
            let nzi = zr.mul(&zi).dbl().add(&ci);
            zr = nzr;
            zi = nzi;
            dr = ndr;
            di = ndi;
            if k + 1 == n {
                zn = (zr.clone(), zi.clone());
                dn = (dr.clone(), di.clone());
            }
        }
        // g = z_{n+p} − z_n ; g' = d_{n+p} − d_n ; c ← c − g/g'
        let gr = zr.sub(&zn.0);
        let gi = zi.sub(&zn.1);
        let hr = dr.sub(&dn.0);
        let hi = di.sub(&dn.1);
        // complex division in f64 for the step direction is fine only for
        // the first few iterations; do it in fixed point via |h|².
        let h2 = hr.sqr().add(&hi.sqr());
        let h2f = h2.to_f64();
        // (g / h) = g * conj(h) / |h|²
        let nr = gr.mul(&hr).add(&gi.mul(&hi));
        let ni = gi.mul(&hr).sub(&gr.mul(&hi));
        // divide by |h|² : scale by 1/h2f (h is O(1)..O(1e3) so f64 is exact enough
        // per-step; Newton converges anyway)
        let inv = Fixed::from_f64(1.0 / h2f, fb);
        let sr = nr.mul(&inv);
        let si = ni.mul(&inv);
        cr = cr.sub(&sr);
        ci = ci.sub(&si);
        if (sr.to_f64().abs() + si.to_f64().abs()) == 0.0 {
            break;
        }
    }
    (cr, ci)
}

fn main() {
    let c = colors();
    let (w, h) = (256u32, 256u32);

    // --- shallow: old renderer vs crisp -------------------------------------
    let (west, south, east, north) = (-0.7500, 0.1000, -0.7400, 0.1100);
    let t = Instant::now();
    let old = render_tile_rgba(west, south, east, north, w, h, 500, GradientFn::Standard, &c);
    println!("old renderer: {:?}", t.elapsed());
    write_ppm("/tmp/shallow_old.ppm", &old, w, h);

    let t = Instant::now();
    let crisp = render_crisp(west, south, east, north, w, h, 500, GradientFn::Standard, &c, CrispOptions::default(), |x, y| iterate_plain(x, y, 500));
    println!("crisp renderer (aa3 + DE): {:?}", t.elapsed());
    write_ppm("/tmp/shallow_crisp.ppm", &crisp, w, h);

    // --- deep: perturbation at 2^-150 around a Misiurewicz point ------------
    let zoom_bits = 150.0;
    let fb = frac_bits_for_zoom(zoom_bits) + 64;
    // seed: a preperiod-4, period-1 Misiurewicz point near the top of the set
    // (f64 Newton would land here too; fixed point gives us 60+ digits).
    let (cr, ci) = misiurewicz((-0.10109636384562, 0.95628651080914), 4, 1, fb);
    println!("Misiurewicz point ≈ ({:.15}, {:.15})", cr.to_f64(), ci.to_f64());

    let max_iter = 20000u32;
    let t = Instant::now();
    let orbit = compute_reference_fixed(&cr, &ci, max_iter);
    println!("reference orbit: {} pts, escaped={} in {:?}", orbit.len(), orbit.escaped, t.elapsed());
    let px = 2f64.powi(-(zoom_bits as i32));
    let half = 128.0 * px;
    let t = Instant::now();
    let bla = BlaTable::build(&orbit, half * 1.5, 2f64.powi(-30));
    println!("BLA table: {} levels in {:?}", bla.max_level(), t.elapsed());

    let empty = BlaTable { levels: Vec::new() };
    let t = Instant::now();
    let deep_nobla = render_crisp(-half, -half, half, half, w, h, max_iter, GradientFn::Log, &c, CrispOptions { aa: 1, de_strength: 0.0, ..Default::default() }, |x, y| iterate_perturbed(&orbit, &empty, x, y, max_iter));
    println!("deep 2^-150, no BLA, aa1: {:?}", t.elapsed());
    write_ppm("/tmp/deep_nobla.ppm", &deep_nobla, w, h);

    let t = Instant::now();
    let deep = render_crisp(-half, -half, half, half, w, h, max_iter, GradientFn::Log, &c, CrispOptions { aa: 1, de_strength: 0.0, ..Default::default() }, |x, y| iterate_perturbed(&orbit, &bla, x, y, max_iter));
    println!("deep 2^-150, BLA, aa1: {:?}", t.elapsed());
    write_ppm("/tmp/deep_bla.ppm", &deep, w, h);
    let diff = deep.iter().zip(deep_nobla.iter()).filter(|(a, b)| (**a as i32 - **b as i32).abs() > 2).count();
    println!("BLA vs no-BLA differing bytes: {diff} / {}", deep.len());

    let t = Instant::now();
    let deep_crisp = render_crisp(-half, -half, half, half, w, h, max_iter, GradientFn::Log, &c, CrispOptions::default(), |x, y| iterate_perturbed(&orbit, &bla, x, y, max_iter));
    println!("deep 2^-150, BLA, aa3 + DE: {:?}", t.elapsed());
    write_ppm("/tmp/deep_crisp.ppm", &deep_crisp, w, h);
}
