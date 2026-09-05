import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";

import "./ui/ui.css";
import Map from "./components/Map";
import ExplorePanel from "./ui/ExplorePanel";
import ExportSheet from "./ui/ExportSheet";
import LibraryOverlay from "./ui/LibraryOverlay";
import Readout from "./ui/Readout";
import SaveSheet from "./ui/SaveSheet";
import StylePanel from "./ui/StylePanel";
import Toast from "./ui/Toast";
import Toolbar from "./ui/Toolbar";
import { useMapRef, useStateUrl, useToast } from "./hooks/state";

/**
 * The picture fills the window; everything else floats over it. One panel
 * (or sheet, or overlay) is open at a time, tracked by `open`.
 */
function App() {
  const mapRefInit = useRef(null);
  const [, setMapRef] = useMapRef();
  // First visit on a wide screen opens Explore so the site explains itself.
  const [open, setOpen] = useState(() => {
    try {
      if (window.innerWidth > 640 && !localStorage.getItem("seenExplore")) {
        localStorage.setItem("seenExplore", "1");
        return "explore";
      }
    } catch (e) {
      /* private mode etc. */
    }
    return null;
  }); // "explore" | "style" | "save" | "export" | "library" | null
  const [, setToast] = useToast();
  const url = useStateUrl();

  useEffect(() => {
    setMapRef(mapRefInit);
  }, [setMapRef]);

  const toggle = useCallback((id) => setOpen((cur) => (id === null || cur === id ? null : id)), []);
  const close = useCallback(() => setOpen(null), []);
  const copyLink = useCallback(() => {
    const full = `${window.location.origin}${process.env.PUBLIC_URL || ""}${url}`;
    navigator.clipboard.writeText(full).then(
      () => setToast("Link copied"),
      () => setToast("Couldn't copy — select the address bar instead")
    );
  }, [url, setToast]);

  return (
    <div className="shell">
      <div className="shell-canvas">
        <Map ref={mapRefInit} />
      </div>
      <Readout />
      <Toolbar open={open} onToggle={toggle} onCopyLink={copyLink} />
      {open === "explore" && <ExplorePanel onClose={close} />}
      {open === "style" && <StylePanel onClose={close} />}
      {open === "save" && <SaveSheet onClose={close} />}
      {open === "export" && <ExportSheet onClose={close} />}
      {open === "library" && <LibraryOverlay onClose={close} />}
      <Toast />
    </div>
  );
}

export default function RootApp() {
  return (
    <Router basename={process.env.PUBLIC_URL || "/"}>
      <App />
    </Router>
  );
}
