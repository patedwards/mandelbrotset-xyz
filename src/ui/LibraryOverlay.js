import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../hooks/store";
import { useToast } from "../hooks/state";
import { encodeColors } from "../utilities/colors";
import { Close, Download, Link, Pencil, Trash, Upload } from "./Icons";
import Sheet from "./Sheet";

function plateMeta(snap) {
  const s = snap.state;
  if (!s) return null;
  const digits = Math.min(12, Math.ceil(s.z * 0.30103) + 2);
  return `${s.x.toFixed(digits)} ${s.y < 0 ? "−" : "+"} ${Math.abs(s.y).toFixed(digits)}i   ×2^${s.z.toFixed(1)}`;
}

/** Saved locations as a wall of plates. */
export default function LibraryOverlay({ onClose }) {
  const navigate = useNavigate();
  const [, setToast] = useToast();
  const { library, removeLibraryItem, updateLibraryItem, syncLibrary } = useStore();
  const [renaming, setRenaming] = useState(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    syncLibrary();
  }, [syncLibrary]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !renaming && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, renaming]);

  const open = (snap) => {
    navigate(snap.url);
    onClose();
  };
  const copyLink = (snap) => {
    const s = snap.state;
    const url = s
      ? `${window.location.origin}${process.env.PUBLIC_URL || ""}/?${new URLSearchParams({
          x: s.x, y: s.y, z: s.z,
          maxIterations: s.maxIterations,
          colors: encodeColors(s.colors),
          gradientFunction: s.gradientFunction,
        })}`
      : `${window.location.origin}${process.env.PUBLIC_URL || ""}${snap.url}`;
    navigator.clipboard.writeText(url);
    setToast("Link copied");
  };
  const exportAll = () => {
    const items = library.map((item) => ({
      ...item,
      thumbnail: localStorage.getItem(item.imageLocation) || null,
    }));
    const blob = new Blob(
      [JSON.stringify({ format: "mandelbrotset-xyz-locations", version: 1, items }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mandelbrot-locations.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importFile = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const items = Array.isArray(data) ? data : data.items || [];
        const current = JSON.parse(localStorage.getItem("library")) || [];
        const existing = new Set(current.map((i) => i.imageLocation));
        const merged = [...current];
        let added = 0;
        items.forEach((item) => {
          if (!item.imageLocation || existing.has(item.imageLocation)) return;
          const { thumbnail, ...rest } = item;
          if (thumbnail) localStorage.setItem(item.imageLocation, thumbnail);
          merged.push(rest);
          added += 1;
        });
        localStorage.setItem("library", JSON.stringify(merged));
        syncLibrary();
        setToast(added ? `Imported ${added} location${added === 1 ? "" : "s"}` : "Nothing new to import");
      } catch (e) {
        setToast("That file isn't a locations export");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <section className="overlay" aria-label="Library">
      <div className="overlay-head">
        <h2>Library</h2>
        <div className="row">
          <label className="btn quiet">
            <Upload />
            Import
            <input type="file" accept="application/json" hidden onChange={importFile} />
          </label>
          <button className="btn quiet" onClick={exportAll} disabled={library.length === 0}>
            <Download />
            Export all
          </button>
          <button className="iconbtn" onClick={onClose} aria-label="Close library">
            <Close />
          </button>
        </div>
      </div>
      <div className="overlay-body">
        {library.length === 0 ? (
          <div className="empty">
            Nothing saved yet. Find somewhere worth coming back to and press L.
          </div>
        ) : (
          <div className="plates">
            {[...library].reverse().map((snap) => (
              <figure className="plate" key={snap.imageLocation} style={{ margin: 0 }}>
                <button className="open" onClick={() => open(snap)} aria-label={`Open ${snap.name || "saved location"}`}>
                  <img src={localStorage.getItem(snap.imageLocation)} alt="" />
                </button>
                <figcaption className="cap">
                  {snap.name && <span className="name">{snap.name}</span>}
                  {plateMeta(snap) && <span className="meta">{plateMeta(snap)}</span>}
                </figcaption>
                <div className="acts">
                  <button className="iconbtn" onClick={() => copyLink(snap)} aria-label="Copy link"><Link /></button>
                  <button className="iconbtn" onClick={() => { setRenaming(snap); setDraft(snap.name || ""); }} aria-label="Rename"><Pencil /></button>
                  <button className="iconbtn" onClick={() => removeLibraryItem(snap.imageLocation)} aria-label="Delete"><Trash /></button>
                </div>
              </figure>
            ))}
          </div>
        )}
      </div>
      {renaming && (
        <Sheet
          title="Rename"
          onClose={() => setRenaming(null)}
          footer={
            <>
              <button className="btn quiet" onClick={() => setRenaming(null)}>Cancel</button>
              <button
                className="btn primary"
                onClick={() => {
                  updateLibraryItem(renaming.imageLocation, draft.trim());
                  setRenaming(null);
                }}
              >
                Save
              </button>
            </>
          }
        >
          <div className="field">
            <label htmlFor="rename">Name</label>
            <input id="rename" className="input" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
          </div>
        </Sheet>
      )}
    </section>
  );
}
