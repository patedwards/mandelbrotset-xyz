import { useState } from "react";
import Controls from "./components/Controls";
import Map from "./components/Map";

/*

Todos:
- return tiles with pixels being [Re, Im, Iterations] and then generating colour in the getTileData method
- incrementing the maxIterations sends the tiles on for more processing rather than regenerating completely OR we store them locally for reading

*/

function App() {
  const [scale, setScale] = useState(1);
  const [maxIterations, setMaxIterations] = useState(100);

  return (
    <div>
      <Map {...{ scale, maxIterations }} />
      <Controls {...{ scale, maxIterations, setScale, setMaxIterations }} />
    </div>
  );
}

export default App;
