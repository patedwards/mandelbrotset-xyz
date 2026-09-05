import { useMemo, useRef, useState } from "react";
import {
  DPI_OPTIONS,
  PAPER_PRESETS,
  exportFilename,
  getMaxCanvasSide,
  renderExport,
} from "../utilities/exportImage";
import {
  useColors,
  useGradientFunction,
  useMaxIterations,
  useToast,
  useX,
  useY,
  useZ,
} from "../hooks/state";
import Sheet from "./Sheet";

/**
 * Print-ready PNG of the current view at a chosen paper size and DPI,
 * rendered offscreen by the worker pool at export quality (aa 3).
 */
export default function ExportSheet({ onClose }) {
  const [x] = useX();
  const [y] = useY();
  const [z] = useZ();
  const [maxIterations] = useMaxIterations();
  const [gradientFunction] = useGradientFunction();
  const [colors] = useColors();
  const [, setToast] = useToast();
  const [paperId, setPaperId] = useState("8x10");
  const [dpi, setDpi] = useState(300);
  const [orientation, setOrientation] = useState("portrait");
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const dims = useMemo(() => {
    const paper = PAPER_PRESETS.find((p) => p.id === paperId);
    if (!paper || paper.w === null) {
      const scale = window.devicePixelRatio || 1;
      return {
        widthPx: Math.round(window.innerWidth * scale),
        heightPx: Math.round(window.innerHeight * scale),
      };
    }
    let w = Math.round(paper.w * dpi);
    let h = Math.round(paper.h * dpi);
    if (orientation === "landscape") [w, h] = [h, w];
    return { widthPx: w, heightPx: h };
  }, [paperId, dpi, orientation]);
  const tooLarge = Math.max(dims.widthPx, dims.heightPx) > getMaxCanvasSide();
  const running = progress !== null;

  const run = async () => {
    setError(null);
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const blob = await renderExport({
        x, y, z,
        widthPx: dims.widthPx,
        heightPx: dims.heightPx,
        maxIterations,
        gradientFunction,
        colors,
        screenHeightPx: window.innerHeight,
        signal: controller.signal,
        onProgress: (done, total) => setProgress(Math.round((100 * done) / total)),
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = exportFilename({ x, y, z });
      a.click();
      URL.revokeObjectURL(a.href);
      setProgress(null);
      setToast("Exported PNG");
      onClose();
    } catch (e) {
      if (!controller.signal.aborted) setError(e.message || String(e));
      setProgress(null);
    }
  };
  const cancel = () => {
    if (abortRef.current) abortRef.current.abort();
    setProgress(null);
  };

  return (
    <Sheet
      title="Export for print"
      onClose={onClose}
      locked={running}
      footer={
        running ? (
          <button className="btn" onClick={cancel}>Cancel</button>
        ) : (
          <>
            <button className="btn quiet" onClick={onClose}>Close</button>
            <button className="btn primary" onClick={run} disabled={tooLarge}>Export PNG</button>
          </>
        )
      }
    >
      <div className="field">
        <label htmlFor="export-size">Size</label>
        <select
          id="export-size"
          className="input"
          value={paperId}
          disabled={running}
          onChange={(e) => setPaperId(e.target.value)}
        >
          {PAPER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>
      {paperId !== "screen" && (
        <>
          <div className="field">
            <span className="field-label">Resolution</span>
            <div className="seg" style={{ gridTemplateColumns: `repeat(${DPI_OPTIONS.length}, 1fr)` }}>
              {DPI_OPTIONS.map((d) => (
                <button key={d} aria-pressed={dpi === d} disabled={running} onClick={() => setDpi(d)}>
                  {d} dpi
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <span className="field-label">Orientation</span>
            <div className="seg cols-2">
              <button aria-pressed={orientation === "portrait"} disabled={running} onClick={() => setOrientation("portrait")}>Portrait</button>
              <button aria-pressed={orientation === "landscape"} disabled={running} onClick={() => setOrientation("landscape")}>Landscape</button>
            </div>
          </div>
        </>
      )}
      <span className="hint">
        {dims.widthPx.toLocaleString()} × {dims.heightPx.toLocaleString()} px
        {tooLarge && " — larger than this browser can draw; choose a smaller size"}
      </span>
      {running && (
        <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </Sheet>
  );
}
