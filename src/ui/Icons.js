// Inline line icons (17px grid, stroked with currentColor). No icon library.
const I = ({ children, ...p }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    {children}
  </svg>
);
export const Palette = (p) => (
  <I {...p}><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-2 0-.6-.3-1-.5-1.4-.3-.5-.5-.9-.5-1.4 0-1 .9-1.8 2-1.8H16a5 5 0 0 0 5-4.9C21 6.4 17 3 12 3Z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="7.5" r="1"/></I>
);
export const Pin = (p) => (
  <I {...p}><path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11Z"/><circle cx="12" cy="10" r="2.2"/></I>
);
export const Print = (p) => (
  <I {...p}><path d="M6 9V4h12v5"/><rect x="4" y="9" width="16" height="8" rx="2"/><path d="M6 14h12v6H6z"/></I>
);
export const Grid = (p) => (
  <I {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></I>
);
export const Link = (p) => (
  <I {...p}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1.5 1.5"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1.5-1.5"/></I>
);
export const Close = (p) => (
  <I {...p}><path d="M6 6l12 12M18 6 6 18"/></I>
);
export const Trash = (p) => (
  <I {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></I>
);
export const Pencil = (p) => (
  <I {...p}><path d="M4 20h4l10.5-10.5a2 2 0 0 0 0-2.8l-1.2-1.2a2 2 0 0 0-2.8 0L4 16v4Z"/><path d="M13 7l4 4"/></I>
);
export const Upload = (p) => (
  <I {...p}><path d="M12 16V4M6 10l6-6 6 6M4 20h16"/></I>
);
export const Download = (p) => (
  <I {...p}><path d="M12 4v12M6 10l6 6 6-6M4 20h16"/></I>
);
export const Check = (p) => (
  <I {...p}><path d="M5 12l5 5L20 7"/></I>
);
