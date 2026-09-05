import { useFlyTo } from "../hooks/state";
import { useIsSmallScreen } from "./useMedia";
import { Close } from "./Icons";
import { PLACES } from "./places";

/** What you're looking at, a few facts, and somewhere to go. */
export default function ExplorePanel({ onClose }) {
  const [, flyTo] = useFlyTo();
  const small = useIsSmallScreen();
  const go = (p) => {
    flyTo({ x: p.x, y: p.y, z: p.z, at: Date.now() });
    if (small) onClose(); // the sheet would cover the destination
  };
  return (
    <aside className="panel panel-side" aria-label="Explore">
      <div className="panel-head">
        <h2>Explore</h2>
        <button className="iconbtn" onClick={onClose} aria-label="Close">
          <Close />
        </button>
      </div>
      <div className="panel-body">
        <div className="field">
          <span className="field-label">Places</span>
          <div className="places">
            {PLACES.map((p) => (
              <button key={p.id} className="place" onClick={() => go(p)}>
                <span className="t">
                  <span>{p.name}</span>
                  <span className="mag">×2^{p.z.toFixed(0)}</span>
                </span>
                <span className="d">{p.blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field prose">
          <span className="field-label">What this is</span>
          <p>
            Pick a point <i>c</i> in the plane and iterate:
          </p>
          <span className="formula">z → z² + c, starting from z = 0</span>
          <p>
            If z stays bounded forever, <i>c</i> is in the Mandelbrot set — the black
            region. If it escapes to infinity, the colour records how many steps that
            took. Every pixel here is that computation, and the boundary between the two
            fates is where all the structure lives.
          </p>
          <p>
            The interior colour and the gradient are yours to change; the shape is not.
            It is the same set for everyone, everywhere, at every scale.
          </p>
        </div>

        <div className="field">
          <span className="field-label">Worth knowing</span>
          <ul className="facts">
            <li>
              Benoit Mandelbrot made the first detailed pictures at IBM in 1980; the
              first crude plot was Brooks and Matelski's, two years earlier.
            </li>
            <li>
              It is a single connected piece (Douady and Hubbard, 1982) — every island
              you see is joined to the main body by filaments too thin to draw.
            </li>
            <li>
              Its boundary has dimension 2 (Shishikura, 1998): a curve that is, in that
              sense, as thick as the plane.
            </li>
            <li>
              Its area is about 1.506 square units. Nobody knows the exact value.
            </li>
            <li>
              Each bulb on the cardioid has a period; count the spokes on the antenna
              growing from a bulb and you have it.
            </li>
            <li>
              Along the real axis it is the bifurcation diagram of the logistic map,
              which is why the Feigenbaum constant turns up here.
            </li>
            <li>
              Zooming past 10¹⁵ is beyond a double-precision number. This viewer keeps
              going by iterating one point at high precision and every pixel as a tiny
              offset from it.
            </li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
