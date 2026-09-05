import { useEffect, useState } from "react";
import {
  useAutoScaleMaxIterations,
  useColors,
  useGradientFunction,
  useMaxIterations,
} from "../hooks/state";
import { Close } from "./Icons";

export const GRADIENT_FUNCTIONS = [
  { name: "standard", label: "Standard" },
  { name: "log", label: "Log" },
  { name: "sqrt", label: "Square root" },
  { name: "exponential", label: "Exponential" },
  { name: "niceGradient", label: "Sine" },
  { name: "pillarMaker", label: "Pillars" },
  { name: "randomPalette", label: "VGA palette" },
  { name: "rust", label: "Grayscale" },
];

const DEFAULT_SWATCHES = [
  "#2c001e", "#e95420", "#ffffff", "#0b1d3a", "#1f6f8b", "#f4d35e",
  "#0d0d0d", "#5c2a9d", "#ff6f59", "#254441", "#43aa8b", "#f9f7f3",
  "#1a1a2e", "#e63946", "#f1faee", "#3d405b", "#81b29a", "#f2cc8f",
];

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, hex: "#" + m[1].toLowerCase() };
}

const STOPS = [
  { key: "start", pos: 0 },
  { key: "middle", pos: 50 },
  { key: "end", pos: 100 },
];

/**
 * Colour: a live gradient bar with three stops and the interior colour beneath
 * it. Click a stop to pick from swatches, the native colour picker, or type a
 * hex. Then the gradient function (how iteration count maps to the bar) and
 * the iteration budget.
 */
export default function StylePanel({ onClose }) {
  const [colors, setColors] = useColors();
  const [gradientFunction, setGradientFunction] = useGradientFunction();
  const [maxIterations, setMaxIterations] = useMaxIterations();
  const [autoScale, setAutoScale] = useAutoScaleMaxIterations();
  const [chosen, setChosen] = useState("middle");
  const [iterDraft, setIterDraft] = useState(String(maxIterations));
  const [swatches, setSwatches] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem("colorFavorites"));
      return Array.isArray(s) && s.length ? s : DEFAULT_SWATCHES;
    } catch (e) {
      return DEFAULT_SWATCHES;
    }
  });
  useEffect(() => {
    localStorage.setItem("colorFavorites", JSON.stringify(swatches));
  }, [swatches]);
  useEffect(() => {
    if (autoScale) setIterDraft(String(maxIterations));
  }, [maxIterations, autoScale]);

  const setColor = (key, hex) => {
    const rgb = hexToRgb(hex);
    if (rgb) setColors({ ...colors, [key]: rgb });
  };
  const current = colors[chosen];
  const inSwatches = swatches.includes(current.hex);
  const bar = `linear-gradient(90deg, ${colors.start.hex} 0%, ${colors.middle.hex} 50%, ${colors.end.hex} 100%)`;

  return (
    <aside className="panel panel-side" aria-label="Style">
      <div className="panel-head">
        <h2>Style</h2>
        <button className="iconbtn" onClick={onClose} aria-label="Close style panel">
          <Close />
        </button>
      </div>
      <div className="panel-body">
        <div className="field">
          <span className="field-label">Colour</span>
          <div className="gradient-bar" style={{ background: bar }}>
            {STOPS.map(({ key, pos }) => (
              <button
                key={key}
                className="gradient-stop"
                style={{ left: `${pos}%`, background: colors[key].hex }}
                aria-pressed={chosen === key}
                aria-label={`${key} colour`}
                onClick={() => setChosen(key)}
              />
            ))}
            <button
              className="gradient-stop inside"
              style={{ left: "50%", background: colors.black.hex }}
              aria-pressed={chosen === "black"}
              aria-label="inside-the-set colour"
              title="Colour of points inside the set"
              onClick={() => setChosen("black")}
            />
          </div>
          <div className="hexes">
            {["start", "middle", "end", "black"].map((key) => (
              <input
                key={key}
                className="input mono"
                value={colors[key].hex}
                maxLength={7}
                aria-label={`${key} hex`}
                onFocus={() => setChosen(key)}
                onChange={(e) => setColor(key, e.target.value)}
              />
            ))}
          </div>
          <div className="swatches" role="listbox" aria-label="Swatches">
            {swatches.map((hex) => (
              <button
                key={hex}
                style={{ background: hex }}
                aria-pressed={current.hex === hex}
                aria-label={hex}
                onClick={() => setColor(chosen, hex)}
              />
            ))}
          </div>
          <div className="row between" style={{ marginTop: 10 }}>
            <label className="btn quiet" style={{ position: "relative" }}>
              Pick any colour
              <input
                type="color"
                value={current.hex}
                onChange={(e) => setColor(chosen, e.target.value)}
                style={{ position: "absolute", inset: 0, opacity: 0, width: "100%", cursor: "pointer" }}
                aria-label="Pick any colour"
              />
            </label>
            <button
              className="btn quiet"
              onClick={() =>
                setSwatches(
                  inSwatches ? swatches.filter((h) => h !== current.hex) : [...swatches, current.hex]
                )
              }
            >
              {inSwatches ? "Remove from swatches" : "Keep as swatch"}
            </button>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Gradient function</span>
          <div className="list" role="listbox">
            {GRADIENT_FUNCTIONS.map((g) => (
              <button
                key={g.name}
                aria-pressed={gradientFunction === g.name}
                onClick={() => setGradientFunction(g.name)}
              >
                {g.label}
                {gradientFunction === g.name && <span className="dot" />}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="row between">
            <span className="field-label">Iterations</span>
            <div className="row" style={{ gap: 8 }}>
              <span className="hint">Scale with zoom</span>
              <button
                role="switch"
                className="switch"
                aria-checked={autoScale}
                aria-label="Scale iterations with zoom"
                onClick={() => setAutoScale(!autoScale)}
              />
            </div>
          </div>
          <div className="row">
            <input
              className="input"
              type="number"
              min={10}
              step={100}
              disabled={autoScale}
              value={iterDraft}
              onChange={(e) => setIterDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && setMaxIterations(Math.max(10, +iterDraft | 0))}
              aria-label="Maximum iterations"
            />
            <button
              className="btn"
              disabled={autoScale || +iterDraft === maxIterations}
              onClick={() => setMaxIterations(Math.max(10, +iterDraft | 0))}
            >
              Apply
            </button>
          </div>
          <span className="hint">
            {autoScale
              ? "Each tile gets a budget from its zoom level; deeper tiles get more."
              : "Higher shows finer detail near the set and costs more time per tile."}
          </span>
        </div>
      </div>
    </aside>
  );
}
