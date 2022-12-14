import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";

import theme from "./Theme";

import Toolbar from "./components/Toolbar";
import Library from "./components/Library";
import Stylebar from "./components/Controls";
import Map from "./components/Map";
import AppBar from "./components/AppBar";
import SetZ from "./components/SetZ";

import { captureImage } from "./utilities/deck";
import { zToLatLon, latLongToZ } from "./utilities/math"

import { useLibraryLU } from "./hooks/library";

const includedViews = [
  {
    "viewState": {
      "width": 1139,
      "height": 984,
      "latitude": 68.67929264422192,
      "longitude": -33.30643542160577,
      "zoom": 13.561446015428118,
      "bearing": 0,
      "pitch": 0,
      "altitude": 1.5,
      "maxZoom": null,
      "minZoom": 0,
      "maxPitch": 60,
      "minPitch": 0,
      "position": [
        0,
        0,
        0
      ]
    },
    "imgPath": "8328f99b-2f5a-4c03-9774-b9b35351bb22.png",
    "scale": "-1",
    "colors": {
      "start": {
        "r": 252,
        "g": 203,
        "b": 0,
        "a": 1,
        "hex": "#fccb00"
      },
      "middle": {
        "r": 219,
        "g": 62,
        "b": 0,
        "hex": "#db3e00"
      },
      "end": {
        "r": 83,
        "g": 0,
        "b": 235,
        "hex": "#5300eb"
      }
    },
    "maxIterations": "500",
    "gradientFunction": "standard"
  },
  {
    "viewState": {
      "width": 1139,
      "height": 984,
      "latitude": 56.4955416501255,
      "longitude": -40.09855778844566,
      "zoom": 7.377379220556012,
      "bearing": 0,
      "pitch": 0,
      "altitude": 1.5,
      "maxZoom": null,
      "minZoom": 0,
      "maxPitch": 60,
      "minPitch": 0,
      "position": [
        0,
        0,
        0
      ]
    },
    "imgPath": "21cef1a8-2b55-41b7-8f04-573c3a24eca9.png",
    "scale": 1,
    "colors": {
      "start": {
        "r": 35,
        "g": 44,
        "b": 51,
        "hex": "#232C33"
      },
      "middle": {
        "r": 219,
        "g": 62,
        "b": 0,
        "hex": "#db3e00"
      },
      "end": {
        "r": 83,
        "g": 0,
        "b": 235,
        "hex": "#5300eb"
      }
    },
    "maxIterations": 100,
    "gradientFunction": "standard"
  }
]


/*

Todos:
- Add a label and description to the saving workflow, and include the z and magnification
- Add a description to the page,and a place for blogging about Mandelbrot set news
- figure out how to make the thumbnails - consider using a Cloud function that automatically runs when the user saves
- Consider using Firestore for everyone's library
- curate a set of places in the set to zoom to, but also show their locations if they repeat
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
  const [z, setZ] = useState({ x: 0, y: 0 })
  const [setZOpen, setSetZOpen] = useState(true)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 1,
    maxZoom: Infinity
  });

  const [savedViews, updateSavedViews] = useLibraryLU()

  useEffect(() => {

    setZ({ ...latLongToZ(viewState), ...viewState, })

  }, [viewState])

  const handleSetZ = z => {
    setViewState({ ...viewState, ...zToLatLon(z) })
  }

  const handleScreenshot = async () => {
    const imgPath = await captureImage({viewState, scale,
      maxIterations,
      colors,
      gradientFunction, ratio: 1}
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
    const imgPath = await captureImage({ viewState, ratio: 0.25, scale,
      maxIterations,
      colors,
      gradientFunction
  })

    const view = {
      viewState, imgPath, scale, colors, maxIterations, gradientFunction
    }

    updateSavedViews(view)

  }

  return (
    <div>
      <AppBar {...{ stylebarOpen, setStylebarOpen, z }} />
      <SetZ {...{ setZOpen, setSetZOpen, z, handleSetZ }} />
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
      <Map {...{ scale, maxIterations, colors, gradientFunction, setViewState, initialViewState: viewState }} />
      <Toolbar {...{ setLibraryOpen, stylebarOpen, setStylebarOpen, handleScreenshot, handleSaveView, setSetZOpen }} />
      <Library {...{ libraryOpen, setLibraryOpen, savedViews, includedViews, setViewState }} />
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

