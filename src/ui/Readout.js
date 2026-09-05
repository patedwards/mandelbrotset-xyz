import { useX, useY, useZ } from "../hooks/state";

/**
 * Where you are. Digits are shown to the precision the zoom warrants
 * (log10 of the magnification, plus a little), grouped in threes so a
 * 30-digit coordinate stays readable, and the magnification is written as a
 * power of two — the honest unit for a tile pyramid — with a decimal gloss.
 */
function fmtCoord(v, digits) {
  const s = Math.abs(v).toFixed(Math.min(20, Math.max(3, digits)));
  const [int, frac = ""] = s.split(".");
  const groups = frac.match(/.{1,3}/g) || [];
  return { sign: v < 0 ? "−" : "+", int, groups };
}

function Coord({ label, value, digits }) {
  const { sign, int, groups } = fmtCoord(value, digits);
  return (
    <>
      <span className="k">{label}</span>
      <span className="v">
        {sign}
        {int}.
        {groups.map((g, i) => (
          <span key={i}>
            {i > 0 ? " " : ""}
            {g}
          </span>
        ))}
      </span>
    </>
  );
}

export default function Readout() {
  const [x] = useX();
  const [y] = useY();
  const [z] = useZ();
  // deck zoom z → 2^z pixels per unit → digits ≈ z·log10(2) + 3
  const digits = Math.ceil(z * 0.30103) + 3;
  const mag = Math.pow(2, z);
  const exp = Math.floor(Math.log10(mag));
  const mant = (mag / Math.pow(10, exp)).toFixed(1);
  return (
    <div className="readout">
      <a className="wordmark" href={process.env.PUBLIC_URL || "/"}>
        mandelbrotset.xyz
      </a>
      <div className="coords">
        <Coord label="re" value={x} digits={digits} />
        <Coord label="im" value={y} digits={digits} />
      </div>
      <div className="mag" aria-label={`magnification 2 to the ${z.toFixed(1)}`}>
        ×2<sup>{z.toFixed(1)}</sup>
        <span className="approx">
          {exp < 4 ? Math.round(mag).toLocaleString() : `${mant} × 10^${exp}`}
        </span>
      </div>
    </div>
  );
}
