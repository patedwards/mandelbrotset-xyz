import { useEffect, useRef } from "react";

import { BrowserRouter as Router } from "react-router-dom";

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
  useIsMobile,
  useMapRef,
  useShowAlert,
  useShowControls,
} from "./hooks/state";
import { InfoPanel } from "./components/InfoPanel";
import init from "wasm-lib";

function App() {
  // get the parameters from the URL
  const urlStateHasLoaded = true; // useUrlStateHasLoaded();
  const isMobile = useIsMobile(); // re-rendering

  init() // init wasm

  const mapRefInit = useRef(null);
  
  // App state
  const theme = useTheme();
  const [showControls, setShowControls] = useShowControls();

  // Alert state
  const [showAlert, setShowAlert] = useShowAlert();

  // Map state
  const [, setMapRef] = useMapRef();

  const handleCloseControls = () => setShowControls(false);

  useEffect(() => {
    setMapRef(mapRefInit);
  }, [mapRefInit, setMapRef]);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    // Reset when component is unmounted
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

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
      {urlStateHasLoaded ? (
        <div>
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
              Image saved to library!
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
            <Map ref={mapRefInit} />
          </div>
          <Library />
          <InfoPanel />
        </div>
      ) : null}
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
