let wasm;

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function getObject(idx) { return heap[idx]; }

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}
/**
* Runs once when the module is instantiated (via wasm-bindgen's `init`, which
* `App.js` and the tile worker already call).
*/
export function __wasm_start() {
    wasm.__wasm_start();
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8Memory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

let cachedUint8ClampedMemory0 = null;

function getUint8ClampedMemory0() {
    if (cachedUint8ClampedMemory0 === null || cachedUint8ClampedMemory0.byteLength === 0) {
        cachedUint8ClampedMemory0 = new Uint8ClampedArray(wasm.memory.buffer);
    }
    return cachedUint8ClampedMemory0;
}

function getClampedArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ClampedMemory0().subarray(ptr / 1, ptr / 1 + len);
}
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
export function render_tile(west, south, east, north, width, height, max_iterations, gradient_function, colors) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(gradient_function, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(colors, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.render_tile(retptr, west, south, east, north, width, height, max_iterations, ptr0, len0, ptr1, len1);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v3 = getClampedArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1, 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

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
export function make_reference_orbit(re_decimal, im_decimal, max_iterations, precision_bits) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(re_decimal, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(im_decimal, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.make_reference_orbit(retptr, ptr0, len0, ptr1, len1, max_iterations, precision_bits);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var r2 = getInt32Memory0()[retptr / 4 + 2];
        if (r2) {
            throw takeObject(r1);
        }
        return ReferenceOrbit.__wrap(r0);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
    return instance.ptr;
}
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
export function render_tile_perturbed(orbit, delta_west, delta_south, delta_east, delta_north, width, height, max_iterations, gradient_function, colors) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        _assertClass(orbit, ReferenceOrbit);
        const ptr0 = passStringToWasm0(gradient_function, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(colors, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        wasm.render_tile_perturbed(retptr, orbit.__wbg_ptr, delta_west, delta_south, delta_east, delta_north, width, height, max_iterations, ptr0, len0, ptr1, len1);
        var r0 = getInt32Memory0()[retptr / 4 + 0];
        var r1 = getInt32Memory0()[retptr / 4 + 1];
        var v3 = getClampedArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_free(r0, r1 * 1, 1);
        return v3;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
* Single-point grayscale escape value in `[0, 1]` (`0.0` = inside the set).
* Retained as a small parity/debugging helper; the app uses [`render_tile`].
* @param {number} c_re
* @param {number} c_im
* @param {number} max_iterations
* @returns {number}
*/
export function evaluate_mandelbrot_grayscale(c_re, c_im, max_iterations) {
    const ret = wasm.evaluate_mandelbrot_grayscale(c_re, c_im, max_iterations);
    return ret;
}

/**
* `Z_0, Z_1, … Z_{len-1}` of the reference point's orbit, as f64 pairs
* (`Z_0 = 0`). `len >= 2` always. The arrays are read by `perturbation::escape`.
*/
export class ReferenceOrbit {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ReferenceOrbit.prototype);
        obj.__wbg_ptr = ptr;

        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;

        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_referenceorbit_free(ptr);
    }
    /**
    * Number of stored iterates.
    * @returns {number}
    */
    get length() {
        const ret = wasm.referenceorbit_length(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
    * Whether the reference point's own orbit diverged before `max_iterations`
    * (a hint that a longer-orbit reference would render the view better).
    * @returns {boolean}
    */
    get escaped() {
        const ret = wasm.referenceorbit_escaped(this.__wbg_ptr);
        return ret !== 0;
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_abda76e883ba8a5f = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_stack_658279fe44541cf6 = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        getInt32Memory0()[arg0 / 4 + 1] = len1;
        getInt32Memory0()[arg0 / 4 + 0] = ptr1;
    };
    imports.wbg.__wbg_error_f851667af71bcfc6 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, maybe_memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedInt32Memory0 = null;
    cachedUint8Memory0 = null;
    cachedUint8ClampedMemory0 = null;

    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(input) {
    if (wasm !== undefined) return wasm;

    if (typeof input === 'undefined') {
        input = new URL('wasm_lib_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof input === 'string' || (typeof Request === 'function' && input instanceof Request) || (typeof URL === 'function' && input instanceof URL)) {
        input = fetch(input);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await input, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync }
export default __wbg_init;
