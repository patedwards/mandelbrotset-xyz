use std::time::Instant;
use wasm_lib::color::{Colors, GradientFn, Rgb};
use wasm_lib::crisp::{render_crisp, CrispOptions};
use wasm_lib::perturb::iterate_plain;
fn main() {
    let c = Colors { start: Rgb::new(44, 0, 30), middle: Rgb::new(233, 84, 32), end: Rgb::new(255, 255, 255), black: Rgb::new(0, 0, 0) };
    let b = (-0.7500, 0.1000, -0.7400, 0.1100);
    for aa in [1u32, 3, 1, 3] {
        let n = std::cell::Cell::new(0u64);
        let t = Instant::now();
        let img = render_crisp(b.0, b.1, b.2, b.3, 256, 256, 500, GradientFn::Standard, &c, CrispOptions { aa, de_strength: 0.6, edge_threshold: 1.0 }, |x, y| { n.set(n.get() + 1); iterate_plain(x, y, 500) });
        println!("aa{aa}: {:?} samples={} checksum={}", t.elapsed(), n.get(), img.iter().map(|&v| v as u64).sum::<u64>());
    }
}
