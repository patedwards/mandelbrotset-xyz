import { useState, useEffect } from "react";

import { ThemeProvider } from "@mui/material/styles";
import PaletteIcon from "@mui/icons-material/Palette";
import EditLocationIcon from "@mui/icons-material/EditLocation";
import EditParametersIcon from "@mui/icons-material/Functions";
import useMediaQuery from "@mui/material/useMediaQuery";

import { Stack, Box } from "@mui/material";

import theme from "./Theme";

import Map from "./components/Map";
import AppBar from "./components/AppBar";
import CoordinateSetter from "./components/Form";
import GradientStyler from "./components/GradientStyler";
import TaskDrawer from "./components/TaskDrawer";

import { zToLatLon, latLongToZ } from "./utilities/math";

const taskNames = {
  coordinateSetter: "COORDINATE_SETTER",
  styleSetter: "STYLE_SETTER",
  parametersSetter: "PARAMETERS_SETTER",
};

/*

Todos:
- Add a label and description to the saving workflow, and include the z and magnification
- Add a description to the page,and a place for blogging about Mandelbrot set news
- figure out how to make the thumbnails - consider using a Cloud function that automatically runs when the user saves
- Consider using Firestore for everyone's library
- curate a set of places in the set to zoom to, but also show their locations if they repeat
- incrementing the maxIterations sends the tiles on for more processing rather than regenerating completely OR we store them locally for reading
- Make the black toggleable (search for idea-1 in code)
- Zoom in on self similarity by linking the scroll of zoom in to panning in the x-direction (https://en.wikipedia.org/wiki/Mandelbrot_set#Self-similarity)
- Demonstrate some geometric properties through interactivity (https://en.wikipedia.org/wiki/Mandelbrot_set#Geometry)
*/

function App() {
  // Parameters
  const [maxIterations, setMaxIterations] = useState(100);
  const [gradientFunction, setGradientFunction] = useState("standard");
  // TODO: move this config to defaults or "inital-settings.js" or something
  const [colors, setColors] = useState({
    start: { r: 35, g: 44, b: 51, hex: "#232C33" },
    middle: { r: 219, g: 62, b: 0, hex: "#db3e00" },
    end: { r: 83, g: 0, b: 235, hex: "#5300eb" },
  });
  // Map state
  const [viewState, setViewState] = useState({
    longitude: 0,
    latitude: 0,
    zoom: 2,
    minZoom: 2,
    maxZoom: Infinity,
  });
  const [z, setZ] = useState({ x: 0, y: 0 });
  // Component toggling
  const [activeTask, setActiveTask] = useState(null);

  const isScreenWidthLessThan400 = useMediaQuery("(max-width:400px)");

  // Available tools
  const tools = {
    xyToggle: {
      label: "Set coordinates",
      onClick: () => setActiveTask(taskNames.coordinateSetter),
      icon: EditLocationIcon,
    },
    parametersToggle: {
      label: "parameters",
      onClick: () => setActiveTask(taskNames.parametersSetter),
      icon: EditParametersIcon,
    },
    styleToggle: {
      label: "style",
      onClick: () => setActiveTask(taskNames.styleSetter),
      icon: PaletteIcon,
    },
  };

  // Activity configuration

  const editTools = [tools.xyToggle, tools.parametersToggle, tools.styleToggle];

  // TODO: put this in a State and use useEffect to update step size and initial value for max its based on Zoom value
  // TODO: make the setViewState work
  const setZActivity = {
    tools: [
      {
        label: "X",
        inputType: "number",
        initialValue: z.x,
        inputProps: { step: 1 / 2 ** (viewState.zoom + 1) },
      },
      {
        label: "Y",
        inputType: "number",
        initialValue: z.y,
        inputProps: { step: 1 / 2 ** (viewState.zoom + 1) },
      },
      {
        label: "Zoom",
        inputType: "number",
        initialValue: viewState.zoom,
        inputProps: { step: 1 },
      },
    ],
  };

  const setZActivityFormSubmit = (formState) => {
    console.log("formState", formState);
    setViewState({
      ...viewState,
      ...zToLatLon({ x: formState["X"], y: formState["Y"] }),
      zoom: formState["Zoom"],
    });
    setMaxIterations(formState["Number of iterations"]);
  };

  const parametersActivity = {
    tools: [
      {
        label: "Number of iterations",
        initialValue: maxIterations,
        inputType: "number",
        inputProps: { step: 100 },
      },
    ],
  };

  const setParametersFormSubmit = (formState) => {
    setMaxIterations(formState["Number of iterations"]);
  };

  useEffect(() => {
    setZ({ ...latLongToZ(viewState), ...viewState });
  }, [viewState]);

  /*
  Careful about cycling dependency here
  useEffect(() => {
  
    setViewState({ ...zToLatLon(z), ...viewState, })
  
  }, [z])
  */

  //
  return (
    <div>
      <Box
        sx={{
          display: "flex",
          flexDirection: isScreenWidthLessThan400 ? "column-reverse" : "row",
          minHeight: "100vh",
        }}
      >
        <TaskDrawer editTools={editTools} />
        <AppBar />
        <Box sx={{ position: "absolute", top: 80, left: 80, width: 360 }}>
          <Stack spacing={2}>
            {activeTask === taskNames.coordinateSetter ? (
              <CoordinateSetter
                {...{ ...setZActivity, formSubmit: setZActivityFormSubmit }}
              />
            ) : null}
            {activeTask === taskNames.styleSetter ? (
              <GradientStyler {...{ colors, setColors, setGradientFunction }} />
            ) : null}
            {activeTask === taskNames.parametersSetter ? (
              <CoordinateSetter
                {...{
                  ...parametersActivity,
                  formSubmit: setParametersFormSubmit,
                }}
              />
            ) : null}
          </Stack>
        </Box>
        <Map
          {...{
            maxIterations,
            colors,
            gradientFunction,
            setViewState,
            initialViewState: viewState,
          }}
        />
      </Box>
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
