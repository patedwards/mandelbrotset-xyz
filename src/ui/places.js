/** Famous places in the set, with the zoom that shows them well.
 *  Coordinates are plain f64 — all of these sit well inside f64 range. */
export const PLACES = [
  {
    id: "overview",
    name: "The whole set",
    blurb: "Cardioid, bulbs and the antenna out to −2. Everything else is on its edge.",
    x: -0.6, y: 0, z: 7.6,
  },
  {
    id: "seahorse",
    name: "Seahorse Valley",
    blurb: "The cleft between the cardioid and the largest bulb, lined with seahorse tails.",
    x: -0.7453, y: 0.1127, z: 12.5,
  },
  {
    id: "seahorse-deep",
    name: "Seahorse spiral, deep",
    blurb: "A double spiral a hundred-billionth of a unit across, at the tip of one tail.",
    x: -0.7436438870371587, y: 0.1318259042053119, z: 30,
  },
  {
    id: "elephant",
    name: "Elephant Valley",
    blurb: "On the east side of the cardioid: a parade of trunks, each one spiralling.",
    x: 0.2755, y: 0.0068, z: 15,
  },
  {
    id: "triple",
    name: "Triple spiral valley",
    blurb: "Three-armed spirals off the north bulb — each arm carries its own copy of the set.",
    x: -0.0885, y: 0.655, z: 17,
  },
  {
    id: "spiral",
    name: "The spiral at −0.7757 + 0.1365i",
    blurb: "A Misiurewicz point: the set is self-similar here, so the spiral repeats however far you zoom.",
    x: -0.77568377, y: 0.13646737, z: 18,
  },
  {
    id: "minibrot",
    name: "The big island",
    blurb: "The largest copy of the whole set, sitting on the antenna at c ≈ −1.7549. Period 3.",
    x: -1.7548777, y: 0, z: 12,
  },
  {
    id: "feigenbaum",
    name: "Feigenbaum point",
    blurb: "Where period-doubling ends on the real axis, c ≈ −1.401155. The same number governs turbulence.",
    x: -1.401155189, y: 0, z: 12,
  },
  {
    id: "scepter",
    name: "Scepter Valley",
    blurb: "Bulbs along the antenna near −1.36, each a period-doubling of the last, with islands in between.",
    x: -1.36, y: 0.005, z: 10.5,
  },
];
