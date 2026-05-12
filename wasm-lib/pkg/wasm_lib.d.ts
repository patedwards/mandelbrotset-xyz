/* tslint:disable */
/* eslint-disable */
/**
* Runs once when the module is instantiated (via wasm-bindgen's `init`, which
* `App.js` and the tile worker already call).
*/
export function __wasm_start(): void;
/**
* Render one Mandelbrot tile to an RGBA8 buffer.
*
* * `west`, `south`, `east`, `north` — the tile rectangle in the complex plane
*   (`re ∈ [west, east]`, `im ∈ [south, north]`); these are deck.gl's
*   `tile.bbox` values.
* * `width`, `height` — pixel size of the tile (256 in the app).
* * `max_iterations` — escape-iteration cap.
* * `gradient_function` — the string name used by the app
*   (`"standard"`, `"rust"`, `"niceGradient"`, `"pillarMaker"`, `"log"`,
*   `"sqrt"`, `"exponential"`, `"randomPalette"`).
* * `colors` — 12 bytes: start RGB, middle RGB, end RGB, black RGB.
*
* Returns a `Uint8ClampedArray` of `width * height * 4` bytes — feed it straight
* to `new ImageData(buf, width, height)`.
* @param {number} west
* @param {number} south
* @param {number} east
* @param {number} north
* @param {number} width
* @param {number} height
* @param {number} max_iterations
* @param {string} gradient_function
* @param {Uint8Array} colors
* @returns {Uint8ClampedArray}
*/
export function render_tile(west: number, south: number, east: number, north: number, width: number, height: number, max_iterations: number, gradient_function: string, colors: Uint8Array): Uint8ClampedArray;
/**
* Compute the perturbation reference orbit for a deep-zoom viewport.
*
* * `re_decimal`, `im_decimal` — the reference point (the viewport centre) as
*   base-10 decimal strings with as many digits as the zoom needs.
* * `max_iterations` — escape-iteration cap (also the orbit length cap).
* * `precision_bits` — mantissa bits for the high-precision iteration; the
*   caller should pass roughly `zoom_depth_bits + 64`. Clamped to ≥ 64.
*
* Returns a `ReferenceOrbit` handle. The caller keeps it alive, passes it to
* [`render_tile_perturbed`] for every tile in the viewport, and calls `.free()`
* when the viewport changes.
* @param {string} re_decimal
* @param {string} im_decimal
* @param {number} max_iterations
* @param {number} precision_bits
* @returns {ReferenceOrbit}
*/
export function make_reference_orbit(re_decimal: string, im_decimal: string, max_iterations: number, precision_bits: number): ReferenceOrbit;
/**
* Render one deep-zoom tile via perturbation against `orbit`.
*
* `delta_*` are the tile rectangle expressed as offsets from the reference
* point (`delta = c - c_ref`) — small enough to be exact f64s. Other arguments
* match [`render_tile`]. Returns a `Uint8ClampedArray` of `width*height*4`
* bytes for `new ImageData(...)`.
* @param {ReferenceOrbit} orbit
* @param {number} delta_west
* @param {number} delta_south
* @param {number} delta_east
* @param {number} delta_north
* @param {number} width
* @param {number} height
* @param {number} max_iterations
* @param {string} gradient_function
* @param {Uint8Array} colors
* @returns {Uint8ClampedArray}
*/
export function render_tile_perturbed(orbit: ReferenceOrbit, delta_west: number, delta_south: number, delta_east: number, delta_north: number, width: number, height: number, max_iterations: number, gradient_function: string, colors: Uint8Array): Uint8ClampedArray;
/**
* Single-point grayscale escape value in `[0, 1]` (`0.0` = inside the set).
* Retained as a small parity/debugging helper; the app uses [`render_tile`].
* @param {number} c_re
* @param {number} c_im
* @param {number} max_iterations
* @returns {number}
*/
export function evaluate_mandelbrot_grayscale(c_re: number, c_im: number, max_iterations: number): number;
/**
* `Z_0, Z_1, … Z_{len-1}` of the reference point's orbit, as f64 pairs
* (`Z_0 = 0`). `len >= 2` always. The arrays are read by `perturbation::escape`.
*/
export class ReferenceOrbit {
  free(): void;
/**
* Whether the reference point's own orbit diverged before `max_iterations`
* (a hint that a longer-orbit reference would render the view better).
*/
  readonly escaped: boolean;
/**
* Number of stored iterates.
*/
  readonly length: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_referenceorbit_free: (a: number) => void;
  readonly referenceorbit_length: (a: number) => number;
  readonly referenceorbit_escaped: (a: number) => number;
  readonly render_tile: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number) => void;
  readonly make_reference_orbit: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly render_tile_perturbed: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number) => void;
  readonly evaluate_mandelbrot_grayscale: (a: number, b: number, c: number) => number;
  readonly __wasm_start: () => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {SyncInitInput} module
*
* @returns {InitOutput}
*/
export function initSync(module: SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
