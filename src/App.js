import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";

import theme from "./Theme";

import Toolbar from "./components/Toolbar";
import Library from "./components/Library";
import Stylebar from "./components/Controls";
import Map from "./components/Map";
import AppBar from "./components/AppBar";
import SetZ from "./components/SetZ";

import { captureImage } from "./utilities/deck";

import { useLibraryLU } from "./hooks/library";

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
    middle: { r: 219, g: 62, b: 0, hex: "#db3e00" },
    end: { r: 83, g: 0, b: 235, hex: "#5300eb" }
  });
  const [stylebarOpen, setStylebarOpen] = useState(false)
  const [setZOpen, setSetZOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 0
  });
  const [views, updateViews] = useLibraryLU()

  const handleScreenshot = async () => {
    const imgPath = await captureImage(viewState, scale,
      maxIterations,
      colors,
      gradientFunction
    )
    const dataUrl = window.localStorage.getItem(imgPath); //canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = "output.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.localStorage.removeItem(imgPath)

  }

  const handleSaveView = async () => {
    const imgPath = await captureImage({ ...viewState, width: 100, height: 100 }, scale,
      maxIterations,
      colors,
      gradientFunction
    )

    // TODO: a function for making the image much smaller (like 10kb)

    const view = {
      viewState, imgPath, scale, colors, maxIterations, gradientFunction
    }

    updateViews(view)

  }

  return (
    <div>
      <AppBar {...{ stylebarOpen, setStylebarOpen }} />
      <SetZ {...{setZOpen, setSetZOpen}}/>
      <Stylebar
        {...{
          stylebarOpen,
          scale,
          maxIterations,
          setScale,
          setMaxIterations,
          colors,
          setColors,
          setGradientFunction,
        }}
      />
      <Map {...{ scale, maxIterations, colors, gradientFunction, setViewState }} />
      <Toolbar {...{ setLibraryOpen, stylebarOpen, setStylebarOpen, handleScreenshot, handleSaveView, setSetZOpen }} />
      <Library {...{ libraryOpen, setLibraryOpen, views }} />
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

