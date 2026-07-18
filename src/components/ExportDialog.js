import React, { useMemo, useRef, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

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
  useX,
  useY,
  useZ,
} from "../hooks/state";

/**
 * Print-ready snapshot dialog: pick a paper size, DPI, and orientation, and a
 * full-resolution PNG of the current view is rendered offscreen (WASM worker
 * pool) and downloaded — independent of the window size.
 */
export default function ExportDialog({ open, onClose }) {
  const [x] = useX();
  const [y] = useY();
  const [z] = useZ();
  const [maxIterations] = useMaxIterations();
  const [gradientFunction] = useGradientFunction();
  const [colors] = useColors();

  const [paperId, setPaperId] = useState("8x10");
  const [dpi, setDpi] = useState(300);
  const [orientation, setOrientation] = useState("portrait");
  const [progress, setProgress] = useState(null); // null = idle, 0..100 = running
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

  const tooLarge =
    Math.max(dims.widthPx, dims.heightPx) > getMaxCanvasSide();

  const handleExport = async () => {
    setError(null);
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const blob = await renderExport({
        x,
        y,
        z,
        widthPx: dims.widthPx,
        heightPx: dims.heightPx,
        maxIterations,
        gradientFunction,
        colors,
        screenHeightPx: window.innerHeight,
        signal: controller.signal,
        onProgress: (done, total) =>
          setProgress(Math.round((100 * done) / total)),
      });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = exportFilename({ x, y, z });
      a.click();
      URL.revokeObjectURL(a.href);
      setProgress(null);
      onClose();
    } catch (e) {
      setError(e.message || String(e));
      setProgress(null);
    }
  };

  const handleCancel = () => {
    if (abortRef.current) abortRef.current.abort();
    setProgress(null);
  };

  const running = progress !== null;

  return (
    <Dialog open={open} onClose={running ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Export for print</DialogTitle>
      <DialogContent>
        <FormControl fullWidth margin="dense" disabled={running}>
          <InputLabel>Size</InputLabel>
          <Select
            label="Size"
            value={paperId}
            onChange={(e) => setPaperId(e.target.value)}
          >
            {PAPER_PRESETS.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {paperId !== "screen" && (
          <>
            <FormControl fullWidth margin="dense" disabled={running}>
              <InputLabel>Resolution</InputLabel>
              <Select
                label="Resolution"
                value={dpi}
                onChange={(e) => setDpi(e.target.value)}
              >
                {DPI_OPTIONS.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d} DPI{d === 300 ? " (print quality)" : ""}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <ToggleButtonGroup
              exclusive
              fullWidth
              size="small"
              sx={{ mt: 1 }}
              value={orientation}
              onChange={(e, v) => v && setOrientation(v)}
              disabled={running}
            >
              <ToggleButton value="portrait">Portrait</ToggleButton>
              <ToggleButton value="landscape">Landscape</ToggleButton>
            </ToggleButtonGroup>
          </>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          {dims.widthPx.toLocaleString()} × {dims.heightPx.toLocaleString()} px
          {tooLarge && " — too large for this browser, choose a smaller size"}
        </Typography>

        {running && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 2 }}
          />
        )}
        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {running ? (
          <Button onClick={handleCancel}>Cancel</Button>
        ) : (
          <>
            <Button onClick={onClose}>Close</Button>
            <Button
              variant="contained"
              onClick={handleExport}
              disabled={tooLarge}
            >
              Export PNG
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
