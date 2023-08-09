import { useState, useEffect, useRef } from "react";

import {
  BrowserRouter as Router,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router-dom";

import { ThemeProvider } from "@mui/material/styles";
import PaletteIcon from "@mui/icons-material/Palette";
import SnapIcon from "@mui/icons-material/Save";
import EditParametersIcon from "@mui/icons-material/Functions";
import useMediaQuery from "@mui/material/useMediaQuery";
import LibraryIcon from "@mui/icons-material/Collections";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

import theme from "./Theme";

import Map from "./components/Map";
import AppBar from "./components/AppBar";
import TaskDrawer from "./components/TaskDrawer";
import Controls from "./components/Controls";
import { taskNames } from "./components/Controls";
import Library from "./components/Library";

import { decodeColors, encodeColors } from "./utilities/colors";

const DEFAULT_MAX_ITERATIONS = 60;

function App() {
  // URL state
  const [searchParams, setSearchParams] = useSearchParams();
  const [getStateFromUrl, setStateFromUrl] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const [showAlert, setShowAlert] = useState(false);
  const [autoScaleMaxiterations, setAutoScaleMaxIterations] = useState(false);
  // Styling state
  const [maxIterations, setMaxIterations] = useState(
    // Initialize maxIterations state from URL parameters or use default values
    parseFloat(searchParams.get("maxIterations")) || DEFAULT_MAX_ITERATIONS
  );
  const [gradientFunction, setGradientFunction] = useState(
    // Initialize gradientFunction state from URL parameters or use default values
    searchParams.get("gradientFunction") || "standard"
  );
  const [colors, setColors] = useState(() => {
    // Initialize colors state from URL parameters or use default values
    const colorParam = searchParams.get("colors");
    if (colorParam) {
      const { start, middle, end } = decodeColors(colorParam);
      return { start, middle, end };
    } else {
      return {
        start: { r: 44, g: 0, b: 30, hex: "#2C001E" },
        middle: { r: 233, g: 84, b: 32, hex: "#E95420" },
        end: { r: 255, g: 255, b: 255, hex: "#FFFFFF" },
      };
    }
  });

  // Map state
  const mapRef = useRef();
  const [viewState, setViewState] = useState({
    // Initialize state from URL parameters or use default values
    longitude: parseFloat(searchParams.get("x")) || -0.45,
    latitude: parseFloat(searchParams.get("y")) || 0,
    zoom: parseFloat(searchParams.get("z")) || 7,
    minZoom: 2,
    maxZoom: Infinity,
    bearing: 0,
    pitch: 0,
  });

  // Component toggling
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Media queries
  const isScreenWidthLessThan400 = useMediaQuery("(max-width:400px)");

  // Event handlers
  const handleCloseControls = () => setShowControls(false);

  const handleShare = ({
    viewState_,
    maxIterations_,
    colors_,
    gradientFunction_,
  }) => {
    // Create a URL query string using the snap's properties
    const newQuery = new URLSearchParams({
      y: viewState_.latitude,
      x: viewState_.longitude,
      z: viewState_.zoom,
      maxIterations: maxIterations_,
      colors: encodeColors(colors_), // encodeColors is a function from src/utilities/colors.js
      gradientFunction: gradientFunction_,
    }).toString();

    // Generate the full URL
    const fullURL = `${window.location.origin}/?${newQuery}`;

    // Copy the URL to the clipboard
    navigator.clipboard.writeText(fullURL);
  };

  const handleLibrarySelect = ({
    newViewState,
    newColors,
    newGradientFunction,
    newMaxIterations,
  }) => {
    // Create a URL query string with the parameters you want to change
    const newQuery = new URLSearchParams({
      y: newViewState.latitude,
      x: newViewState.longitude,
      z: newViewState.zoom,
      maxIterations: newMaxIterations,
    }).toString();

    console.log("updating...", maxIterations, newMaxIterations);

    // Navigate to the new URL
    navigate(`/?${newQuery}`, { replace: true });
    setColors(newColors);
    setGradientFunction(newGradientFunction);
    setMaxIterations(newMaxIterations);
    setStateFromUrl(true);
  };

  const handleButtonClick = () => {
    if (mapRef.current) {
      mapRef.current.captureThumbnail();
    }

    // Show the alert
    setShowAlert(true);

    // Auto-hide the alert after 3 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  // as zoom changes, auto scale max iterations
  useEffect(() => {
    if (autoScaleMaxiterations) {
      const newMaxIterations = Math.floor(20 + viewState.zoom ** 2);
      setMaxIterations(newMaxIterations);
    }
  }, [viewState.zoom, autoScaleMaxiterations]);

  // This effect runs when the URL changes, and updates the state accordingly (if the state has not already been updated from the URL)
  useEffect(() => {
    if (!getStateFromUrl) {
      return;
    }

    const queryParams = new URLSearchParams(location.search);

    // Parse the parameters from the URL query
    const newViewState = {
      latitude: parseFloat(queryParams.get("y")) || 0,
      longitude: parseFloat(queryParams.get("x")) || -0.45,
      zoom: parseFloat(queryParams.get("z")) || 7,
      minZoom: 2,
      maxZoom: Infinity,
      bearing: 0,
      pitch: 0,
    };
    const newMaxIterations = parseInt(queryParams.get("maxIterations"));

    setViewState(newViewState);
    setMaxIterations(newMaxIterations || DEFAULT_MAX_ITERATIONS);
    setStateFromUrl(false);
  }, [location.search, getStateFromUrl]);

  // Update URL when state changes
  useEffect(() => {
    setSearchParams({
      x: viewState.longitude.toString(),
      y: viewState.latitude.toString(),
      z: viewState.zoom.toString(),
      // don't include the "#" in the URL
      maxIterations: maxIterations || DEFAULT_MAX_ITERATIONS,
      colors:
        `${colors.start.hex}-${colors.middle.hex}-${colors.end.hex}`.replace(
          /#/g,
          ""
        ),
      gradientFunction: gradientFunction,
    });
  }, [viewState, maxIterations, gradientFunction, colors, setSearchParams]);

  // Available tools
  const tools = {
    styleToggle: {
      label: "style",
      onClick: () => {
        setShowControls(!showControls);
      },
      icon: PaletteIcon,
    },
    captureButton: {
      label: "capture-map",
      onClick: handleButtonClick,
      icon: SnapIcon,
    },
    openLibraryButton: {
      label: "open-image-in-new-tab",
      onClick: () => setLibraryOpen(true),
      icon: LibraryIcon,
    },
  };

  // Activity configuration
  const editTools = [
    tools.styleToggle,
    tools.captureButton,
    tools.openLibraryButton,
  ];

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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isScreenWidthLessThan400 ? "column" : "row",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        overflow: "hidden", // to avoid scrolling of the main container
      }}
    >
      <Snackbar
        open={showAlert}
        autoHideDuration={3000}
        onClose={() => setShowAlert(false)}
        anchorOrigin={{
          vertical: "top",
          // make it below the app bar on small screens
          horizontal: isScreenWidthLessThan400 ? "center" : "left",
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
      {/* Render the TaskDrawer */}
      <TaskDrawer editTools={editTools} />

      {/* Render the AppBar */}
      <AppBar />

      {/* Render the Controls when active */}
      {showControls && (
        <Controls
          {...{
            parametersActivity,
            setAutoScaleMaxIterations,
            setParametersFormSubmit,
            colors,
            setColors,
            setGradientFunction,
            handleCloseControls,
            autoScaleMaxiterations, setAutoScaleMaxIterations,
          }}
        />
      )}

      {/* Render the main Map component. This should expand to take any available space. */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <Map
          ref={mapRef}
          {...{
            maxIterations,
            colors,
            gradientFunction,
            setViewState,
            initialViewState: viewState,
          }}
        />
      </div>

      {/* Render the Library dialog */}
      <Library
        libraryOpen={libraryOpen}
        setLibraryOpen={setLibraryOpen}
        handleLibrarySelect={handleLibrarySelect}
        handleShare={handleShare}
      />
    </div>
  );
}

const RootApp = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <App />
      </Router>
    </ThemeProvider>
  );
};

export default RootApp;
