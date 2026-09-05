import { useState } from "react";
import {
  useColors,
  useGradientFunction,
  useMapRef,
  useMaxIterations,
  useStateUrl,
  useToast,
  useX,
  useY,
  useZ,
} from "../hooks/state";
import Sheet from "./Sheet";

export default function SaveSheet({ onClose }) {
  const [mapRef] = useMapRef();
  const url = useStateUrl();
  const [x] = useX();
  const [y] = useY();
  const [z] = useZ();
  const [maxIterations] = useMaxIterations();
  const [gradientFunction] = useGradientFunction();
  const [colors] = useColors();
  const [, setToast] = useToast();
  const [name, setName] = useState("");

  const save = () => {
    if (mapRef && mapRef.current) {
      mapRef.current.captureThumbnail(url, {
        name: name.trim() || undefined,
        state: { x, y, z, maxIterations, gradientFunction, colors },
      });
      setToast(name.trim() ? `Saved “${name.trim()}”` : "Saved to library");
    }
    onClose();
  };

  return (
    <Sheet
      title="Save this location"
      onClose={onClose}
      footer={
        <>
          <button className="btn quiet" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save}>Save</button>
        </>
      }
    >
      <div className="field">
        <label htmlFor="save-name">Name</label>
        <input
          id="save-name"
          className="input"
          autoFocus
          placeholder="Optional, e.g. Seahorse Valley"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <span className="hint">
          Stores the view, colours and iteration settings with a thumbnail. Nothing leaves this browser.
        </span>
      </div>
    </Sheet>
  );
}
