import { useEffect, useRef, useState } from "react";

import { BrowserRouter as Router, useSearchParams } from "react-router-dom";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { ThemeProvider, useTheme } from "@mui/material/styles";
import themeSpec from "./Theme";

import AppBar from "./components/AppBar";
import ControlAccordion from "./components/ControlAccordion";
import Library from "./components/Library";
import Map from "./components/Map";
import { styleTaskActivities } from "./components/StyleTaskActivities";
import TaskDrawer from "./components/TaskDrawer";
import {
  useColors,
  useGradientFunction,
  useIsMobile,
  useMapRef,
  useMaxIterations,
  useShowAlert,
  useShowControls,
  useViewState,
} from "./hooks/state";
import { encodeColors } from "./utilities/colors";

const DEFAULT_MAX_ITERATIONS = 60;

function App() {
  // internal only component state
  const [autoScaleMaxiterations] = useState(false);
  const mapRefInit = useRef(null);

  // App state
  const theme = useTheme();
  const [showControls, setShowControls] = useShowControls();
  const isMobile = useIsMobile();
  const [, setSearchParams] = useSearchParams();

  // Alert state
  const [showAlert, setShowAlert] = useShowAlert();

  // Styling state
  const [maxIterations, setMaxIterations] = useMaxIterations();
  const [gradientFunction] = useGradientFunction();
  const [viewState] = useViewState();
  const [colors] = useColors();

  // Map state
  const [mapRef, setMapRefState] = useMapRef();

  const handleCloseControls = () => setShowControls(false);

  useEffect(() => {
    setMapRefState(mapRefInit);
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Reset when component is unmounted
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // as zoom changes, auto scale max iterations
  useEffect(() => {
    const idealMaxIterations = Math.floor(20 + viewState.zoom ** 2);
    // only update if idealMaxIterations is greater than current maxIterations by a factor of 2
    // or if it's less than the current maxIterations by a factor of 2
    if (autoScaleMaxiterations && idealMaxIterations > maxIterations * 2) {
      const newMaxIterations = Math.floor(20 + viewState.zoom ** 2);
      setMaxIterations(newMaxIterations);
    }
  }, [viewState.zoom, autoScaleMaxiterations, maxIterations, setMaxIterations]);

  // Update URL when state changes
  useEffect(() => {
    setSearchParams({
      // convert to uppercase to match the URL toString().
      x: viewState.longitude.toString(),
      y: viewState.latitude.toString(),
      z: viewState.zoom.toString(),
      // don't include the "#" in the URL
      maxIterations: maxIterations || DEFAULT_MAX_ITERATIONS,
      colors: encodeColors({ ...colors }),
      gradientFunction: gradientFunction,
    });
  }, [viewState, maxIterations, gradientFunction, colors, setSearchParams]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        overflow: "hidden", // to avoid scrolling of the main container
      }}
    >
      <AppBar />
      <Snackbar
        open={showAlert}
        autoHideDuration={3000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{
          vertical: "top",
          horizontal: isMobile ? "center" : "center",
        }}
        style={{
          top: theme.structure.appBarHeight, // Assuming the appBarHeight is the exact height of the AppBar
        }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setShowAlert(false)}
        >
          Image saved to library
        </Alert>
      </Snackbar>
      <TaskDrawer />
      {showControls && (
        <ControlAccordion
          {...{
            handleCloseControls,
            activities: styleTaskActivities,
          }}
        />
      )}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Map ref={mapRef} />
      </div>
      <Library />
    </div>
  );
}

const RootApp = () => {
  return (
    <ThemeProvider theme={themeSpec}>
      <Router>
        <App />
      </Router>
    </ThemeProvider>
  );
};

export default RootApp;
