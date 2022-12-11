import { useState } from "react";
import Controls from "./components/Controls";
import Map from "./components/Map";
import AppBar from "./components/AppBar";
import theme from "./Theme";
import { ThemeProvider } from "@mui/material/styles";
/*

Todos:
- incrementing the maxIterations sends the tiles on for more processing rather than regenerating completely OR we store them locally for reading
- Make the black toggleable (search for idea-1 in code)
*/

function App() {
  const [scale, setScale] = useState(1);
  const [maxIterations, setMaxIterations] = useState(100);
  const [gradientFunction, setGradientFunction] = useState("standard");
  const [colors, setColors] = useState({
    start: { r: 35, g: 44, b: 51, hex: "#232C33" }, 
    middle: { r: 219, g: 62, b: 0, hex: "#db3e00"},
    end: { r: 83, g: 0, b: 235, hex: "#5300eb" }
  });
  const [stylebarOpen, setStylebarOpen] = useState(false)

  return (
    <div>
      <AppBar {...{stylebarOpen, setStylebarOpen}}/>
      <Controls
        {...{
          stylebarOpen,
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

const RootApp = () => {
  return (
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  );
};

export default RootApp;

