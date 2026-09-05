import { useEffect } from "react";
import { Close } from "./Icons";

/** Centered modal sheet. Escape and scrim-click close unless `locked`. */
export default function Sheet({ title, onClose, locked, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !locked && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, locked]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && !locked && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="panel-head">
          <h2>{title}</h2>
          {!locked && (
            <button className="iconbtn" onClick={onClose} aria-label="Close">
              <Close />
            </button>
          )}
        </div>
        <div className="panel-body">{children}</div>
        {footer && <div className="panel-foot">{footer}</div>}
      </div>
    </div>
  );
}
