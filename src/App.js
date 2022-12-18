import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import LibraryIcon from '@mui/icons-material/PhotoLibrary';
import PaletteIcon from "@mui/icons-material/Palette";
import SaveIcon from '@mui/icons-material/BookmarkAdd';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';
import { Stack, Box } from "@mui/material";

import theme from "./Theme";

import Library from "./components/Library";
import Map from "./components/Map";
import AppBar from "./components/AppBar";
import CoordinateSetter from "./components/Form"
import GradientStyler from "./components/GradientStyler"
import TaskDrawer from "./components/TaskDrawer";

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
  // Parameters
  const [scale, setScale] = useState(1);
  const [maxIterations, setMaxIterations] = useState(100);
  const [gradientFunction, setGradientFunction] = useState("standard");
  // TODO: move this config to defaults or "inital-settings.js" or something
  const [colors, setColors] = useState({
    start: { r: 35, g: 44, b: 51, hex: "#232C33" },
    middle: { r: 219, g: 62, b: 0, hex: "#db3e00" },
    end: { r: 83, g: 0, b: 235, hex: "#5300eb" }
  });
  // Map state
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 2,
    minZoom: 2,
    maxZoom: Infinity
  });
  const [z, setZ] = useState({ x: 0, y: 0 })
  // Component toggling
  const [showCoordinateSetter, setShowCoordinateSetter] = useState(false)
  const [stylebarOpen, setStylebarOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)

  // Meta-application state
  const [savedViews, updateSavedViews] = useLibraryLU()

  // event handlers
  const handleScreenshot = async () => {
    const imgPath = await captureImage({
      viewState, scale,
      maxIterations,
      colors,
      gradientFunction, ratio: 1
    }
    )
    const dataUrl = window.localStorage.getItem(imgPath); //canvas.toDataURL("image/png").replace("image/png", "image/octet-stream")
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = "output.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

  }

  const handleSaveView = async () => {
    const imgPath = await captureImage({
      viewState, ratio: 0.25, scale,
      maxIterations,
      colors,
      gradientFunction
    })

    const view = {
      viewState, imgPath, scale, colors, maxIterations, gradientFunction
    }

    updateSavedViews(view)

  }

  const handleLoadView = (view) => {
    console.log("view", view)
    setViewState((({ latitude, longitude, zoom, bearing, pitch }) => ({ latitude, longitude, zoom, bearing, pitch }))(view.viewState))
    setColors(view.colors)
    setMaxIterations(view.maxIterations)
    setGradientFunction(view.gradientFunction)
    setScale(view.scale)
  }

  // Available tools
  const tools = {
    xyToggle: {
      label: "Set coordinates",
      onClick: () => setShowCoordinateSetter(!showCoordinateSetter),
      icon: EditLocationIcon
    },
    libraryToggle: {
      label: "library",
      onClick: () => setLibraryOpen(!libraryOpen),
      icon: LibraryIcon
    },
    saveToggle: {
      label: "save",
      onClick: handleSaveView,
      icon: SaveIcon
    },
    captureToggle: {
      label: "capture",
      onClick: handleScreenshot,
      icon: ScreenshotMonitorIcon
    },
    styleToggle: {
      label: "style",
      onClick: () => setStylebarOpen(!stylebarOpen),
      icon: PaletteIcon
    }
  }


  // Activity configuration

  const appBarTools = [tools.xyToggle, tools.styleToggle, tools.libraryToggle, tools.saveToggle, tools.captureToggle]

  // TODO: put this in a State and use useEffect to update step size and initial value for max its based on Zoom value
  // TODO: make the setViewState work
  const setZActivity = {
    tools: [
      {
        label: "X", inputType: "number", initialValue: z.x, inputProps: { step: 1 / 2 ** (viewState.zoom + 1) }
      },
      {
        label: "Y", inputType: "number", initialValue: z.y, inputProps: { step: 1 / 2 ** (viewState.zoom + 1) }
      },
      {
        label: "Zoom", inputType: "number", initialValue: viewState.zoom, inputProps: { step: 1 }
      },
      {
        label: "Scale", inputType: "number", initialValue: scale, inputProps: { step: 1 }
      },
      { label: "Number of iterations", initialValue: maxIterations, inputType: "number", inputProps: { step: 100 } }
    ]
  }

  const setZActivityFormSubmit = formState => {
    console.log("formState", formState)
    setViewState({
      ...viewState,
      ...zToLatLon({ x: formState["X"], y: formState["Y"] }),
      zoom: formState["Zoom"],
    })
    setScale(formState["Scale"])
    setMaxIterations(formState["Number of iterations"])
  }

  useEffect(() => {

    setZ({ ...latLongToZ(viewState), ...viewState, })

  }, [viewState])

  /*
  Careful about cycling dependency here
  useEffect(() => {
  
    setViewState({ ...zToLatLon(z), ...viewState, })
  
  }, [z])
  */


  //
  return (
    <div>
      <TaskDrawer tools={appBarTools} />
      <AppBar {...{ stylebarOpen, setStylebarOpen, z, zoom: viewState.zoom }} />
      <Box sx={{ position: "absolute", top: 80, left: 80, width: 360 }}>
        <Stack spacing={2}>
          <CoordinateSetter {...{ ...setZActivity, isActive: showCoordinateSetter, formSubmit: setZActivityFormSubmit }} />
          <GradientStyler {...{ colors, setColors, isActive: stylebarOpen }} />
        </Stack>
      </Box>
      <Map {...{ scale, maxIterations, colors, gradientFunction, setViewState, initialViewState: viewState }} />
      <Library {...{ libraryOpen, setLibraryOpen, savedViews, includedViews, handleLoadView }} />
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

