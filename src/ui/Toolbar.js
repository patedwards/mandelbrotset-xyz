import { useEffect } from "react";
import { Compass, Grid, Link, Palette, Pin, Print } from "./Icons";

/**
 * The five things you can do, in one pill. Each has a single-key shortcut;
 * the pressed state shows which panel is open.
 */
export default function Toolbar({ open, onToggle, onCopyLink }) {
  const tools = [
    { id: "explore", label: "Explore", key: "i", icon: Compass },
    { id: "style", label: "Style", key: "s", icon: Palette },
    { id: "save", label: "Save location", key: "l", icon: Pin },
    { id: "export", label: "Export", key: "e", icon: Print },
    { id: "library", label: "Library", key: "g", icon: Grid },
    { id: "link", label: "Copy link", key: "c", icon: Link, action: onCopyLink },
  ];

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.key === "Escape") return onToggle(null);
      const tool = tools.find((x) => x.key === e.key.toLowerCase());
      if (!tool) return;
      e.preventDefault();
      tool.action ? tool.action() : onToggle(tool.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onToggle, onCopyLink]);

  return (
    <nav className="toolbar" aria-label="Tools">
      {tools.map(({ id, label, key, icon: Icon, action }) => (
        <button
          key={id}
          className="tool"
          aria-pressed={!action && open === id}
          aria-label={label}
          title={`${label} (${key.toUpperCase()})`}
          onClick={() => (action ? action() : onToggle(id))}
        >
          <Icon />
          <span>{label}</span>
          <kbd>{key.toUpperCase()}</kbd>
        </button>
      ))}
    </nav>
  );
}
