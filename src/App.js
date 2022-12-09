import { useState } from "react";
import Controls from "./components/Controls";
import Map from "./components/Map";
/*

Todos:
- return tiles with pixels being [Re, Im, Iterations] and then generating colour in the getTileData method
- incrementing the maxIterations sends the tiles on for more processing rather than regenerating completely OR we store them locally for reading
- Make the black toggleable (search for idea-1 in code)
*/

function App() {
  const [scale, setScale] = useState(1);
  const [maxIterations, setMaxIterations] = useState(100);
  const [gradientFunction, setGradientFunction] = useState("pillarMaker");
  const [colors, setColors] = useState({
    start: { r: 255, g: 51, b: 51 },
    middle: { r: 51, g: 255, b: 51 },
    end: { r: 51, g: 51, b: 255 }
  });

  return (
    <div>
      <Controls
        {...{
          scale,
          maxIterations,
          setScale,
          setMaxIterations,
          colors,
          setColors,
          setGradientFunction
        }}
      />
      <Map {...{ scale, maxIterations, colors, gradientFunction }} />
    </div>
  );
}

export default App;
