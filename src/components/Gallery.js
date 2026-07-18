import React, { useEffect, useRef, useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import { useStore } from "../hooks/store";
import { encodeColors } from "../utilities/colors";
import { renderExport } from "../utilities/exportImage";

const CARD_W = 720;
const CARD_H = 480;

/** ×2^z magnification, written the way you'd say it: ×1,024 · ×34 billion. */
const magnification = (z) => {
  const m = Math.pow(2, z);
  if (m >= 1e12) return `×${(m / 1e12).toPrecision(3)} trillion`;
  if (m >= 1e9) return `×${(m / 1e9).toPrecision(3)} billion`;
  if (m >= 1e6) return `×${(m / 1e6).toPrecision(3)} million`;
  return `×${Math.round(m).toLocaleString()}`;
};

const coordLine = (state) =>
  `re ${state.x.toFixed(Math.min(15, Math.max(4, Math.ceil(state.z / 3.3) + 2)))}  ` +
  `im ${state.y.toFixed(Math.min(15, Math.max(4, Math.ceil(state.z / 3.3) + 2)))}`;

const explorerUrl = (state) =>
  `/?x=${state.x}&y=${state.y}&z=${state.z}&maxIterations=${state.maxIterations}` +
  `&colors=${encodeColors(state.colors)}&gradientFunction=${state.gradientFunction}`;

/** One plate: renders its location live through the WASM pool at card size. */
const Plate = ({ item, index, onOpen }) => {
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);
  const urlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const state = item.state;
    if (!state) {
      // Pre-locations library item: fall back to its stored thumbnail.
      setSrc(localStorage.getItem(item.imageLocation));
      return;
    }
    renderExport({
      ...state,
      widthPx: CARD_W,
      heightPx: CARD_H,
      screenHeightPx: 900, // frame roughly as a desktop view of this z
    })
      .then((blob) => {
        if (cancelled) return;
        urlRef.current = URL.createObjectURL(blob);
        setSrc(urlRef.current);
      })
      .catch(() => {
        if (cancelled) return;
        setSrc(localStorage.getItem(item.imageLocation));
        setFailed(true);
      });
    return () => {
      cancelled = true;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, [item]);

  const state = item.state;
  return (
    <Box
      component="figure"
      onClick={onOpen}
      sx={{
        m: 0,
        cursor: "pointer",
        breakInside: "avoid",
        "&:focus-visible": { outline: "2px solid #cfcfcf", outlineOffset: 4 },
      }}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <Box
        sx={{
          position: "relative",
          aspectRatio: `${CARD_W} / ${CARD_H}`,
          background:
            "repeating-linear-gradient(45deg, #101012, #101012 10px, #131316 10px, #131316 20px)",
          overflow: "hidden",
          transition: "transform 240ms ease",
          "figure:hover &": { transform: "scale(1.01)" },
          "@media (prefers-reduced-motion: reduce)": {
            transition: "none",
            "figure:hover &": { transform: "none" },
          },
        }}
      >
        {src && (
          <img
            src={src}
            alt={item.name || "Saved location in the Mandelbrot set"}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        )}
      </Box>
      <Box
        component="figcaption"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 2,
          pt: 1.25,
          pb: 0.5,
          borderTop: "1px solid #2a2a2e",
          mt: 1.25,
        }}
      >
        <Box>
          <Typography sx={{ color: "#e8e8e8", fontSize: 15, letterSpacing: 0.2 }}>
            {item.name || `Plate ${String(index + 1).padStart(2, "0")}`}
          </Typography>
          {state && (
            <Typography
              sx={{
                color: "#8a8a90",
                fontFamily: "'Ubuntu Mono', ui-monospace, monospace",
                fontSize: 12,
                whiteSpace: "pre",
              }}
            >
              {coordLine(state)}
              {failed ? "  · thumbnail" : ""}
            </Typography>
          )}
        </Box>
        {state && (
          <Typography
            sx={{
              color: "#c9c9cf",
              fontFamily: "'Ubuntu Mono', ui-monospace, monospace",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            {magnification(state.z)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

/**
 * /gallery — the saved-locations portfolio. Each location is re-rendered live
 * at card resolution through the WASM worker pool (no stale 200px thumbnails),
 * captioned plate-archive style with its coordinates and magnification.
 */
export default function Gallery() {
  const { library } = useStore();
  const navigate = useNavigate();
  const items = [...library].reverse(); // newest first

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0b0b0d",
        color: "#e8e8e8",
        px: { xs: 2.5, md: 6 },
        py: { xs: 4, md: 7 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          maxWidth: 1360,
          mx: "auto",
          mb: { xs: 3, md: 5 },
        }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{ fontSize: { xs: 26, md: 34 }, fontWeight: 300, letterSpacing: 1 }}
          >
            Gallery
          </Typography>
          <Typography sx={{ color: "#8a8a90", fontSize: 14, mt: 0.5 }}>
            {items.length > 0
              ? `${items.length} saved location${items.length === 1 ? "" : "s"}, rendered live`
              : "Locations you save while exploring appear here"}
          </Typography>
        </Box>
        <Button
          onClick={() => navigate("/")}
          sx={{ color: "#c9c9cf", textTransform: "none" }}
        >
          ← Explore
        </Button>
      </Box>

      {items.length === 0 ? (
        <Box sx={{ maxWidth: 1360, mx: "auto", py: 10, textAlign: "center" }}>
          <Typography sx={{ color: "#8a8a90" }}>
            No saved locations yet. Explore the set, then use Save location to
            start your gallery.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => navigate("/")}
            sx={{ mt: 3, color: "#e8e8e8", borderColor: "#3a3a3e", textTransform: "none" }}
          >
            Start exploring
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            maxWidth: 1360,
            mx: "auto",
            columnCount: { xs: 1, sm: 2, lg: 3 },
            columnGap: "28px",
            "& > figure": { mb: "36px", display: "inline-block", width: "100%" },
          }}
        >
          {items.map((item, i) => (
            <Plate
              key={item.imageLocation}
              item={item}
              index={items.length - 1 - i}
              onOpen={() => item.state && navigate(explorerUrl(item.state))}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
