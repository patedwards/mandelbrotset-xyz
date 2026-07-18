import LibraryIcon from "@mui/icons-material/Collections";
import PaletteIcon from "@mui/icons-material/Palette";
import InfoIcon from "@mui/icons-material/Info";
import SnapIcon from "@mui/icons-material/Save";
import PrintIcon from "@mui/icons-material/Print";
import useMediaQuery from "@mui/material/useMediaQuery";

import { Toolbar } from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import MuiDrawer from "@mui/material/Drawer";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Paper from "@mui/material/Paper";
import Tooltip from "@mui/material/Tooltip";

import { useTheme } from "@mui/material/styles"; // Import the useTheme hook
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import {
  useColors,
  useGradientFunction,
  useIsMobile,
  useMapRef,
  useMaxIterations,
  useShowAlert,
  useShowControls,
  useLibraryOpen,
  useShowInfo,
  useStateUrl,
  useX,
  useY,
  useZ,
} from "../hooks/state";
import ExportDialog from "./ExportDialog";

const Task = (task) => {
  const theme = useTheme();

  const isMobile = useMediaQuery("(max-width:600px)");

  // task content for mobile and desktop
  const taskContent = (
    <>
      <ListItemIcon
        sx={{
          minWidth: 0,
          justifyContent: "center",
          color: theme.palette.primary.main,
        }}
      >
        <task.icon />
      </ListItemIcon>
      {isMobile && <div>{task.label}</div>} {/* Render label only on mobile */}
    </>
  );

  return (
    <ListItem key={task.label} disablePadding>
      {isMobile ? (
        <ListItemButton
          {...task}
          sx={{
            width: "auto",
            height: 48,
            display: "flex",
            flexDirection: "column", // Vertically stack the icon and label for mobile
            justifyContent: "center",
            alignItems: "center",
            padding: "0 0.75rem",
          }}
        >
          {taskContent}
        </ListItemButton>
      ) : (
        <Tooltip title={task.label} placement="right">
          <ListItemButton
            {...task}
            sx={{
              width: "auto",
              height: 48,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "0 0.75rem",
            }}
          >
            {taskContent}
          </ListItemButton>
        </Tooltip>
      )}
    </ListItem>
  );
};

export default function TaskDrawer() {
  const isMobileScreen = useIsMobile();
  const [showControls, setShowControls] = useShowControls();
  const [, setShowAlert] = useShowAlert();
  const [, setLibraryOpen] = useLibraryOpen();
  const [showInfo, setShowInfo] = useShowInfo();
  const theme = useTheme();
  const [mapRef] = useMapRef();
  const url = useStateUrl();
  const [x] = useX();
  const [y] = useY();
  const [z] = useZ();
  const [maxIterations] = useMaxIterations();
  const [gradientFunction] = useGradientFunction();
  const [colors] = useColors();

  const [saveOpen, setSaveOpen] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const handleSaveConfirm = () => {
    if (mapRef.current) {
      mapRef.current.captureThumbnail(url, {
        name: locationName || undefined,
        state: { x, y, z, maxIterations, gradientFunction, colors },
      });
    }
    setSaveOpen(false);
    setLocationName("");

    // !! This exists in hooks/state.js
    // !! Also, this is a good place to add "alertMessage" to state
    // Mabye replace "showAlert" with "alertMessage"
    // e.g {show: true, message: "Image saved to library"}
    setShowAlert(true);

    // Auto-hide the alert after 3 seconds
    setTimeout(() => {
      setShowAlert(false);
    }, 3000);
  };

  const tasks = [
    {
      label: "Info",
      onClick: () => {
        setShowInfo(!showInfo);
        setShowControls(false);
      },
      icon: InfoIcon,
    },
    {
      label: "Style",
      onClick: () => {
        setShowControls(!showControls);
        setShowInfo(false);
      },
      icon: PaletteIcon,
    },
    {
      label: "Save location",
      onClick: () => setSaveOpen(true),
      icon: SnapIcon,
    },
    {
      label: "Export for print",
      onClick: () => setExportOpen(true),
      icon: PrintIcon,
    },
    {
      label: "Image Library",
      onClick: () => setLibraryOpen(true),
      icon: LibraryIcon,
    },
  ];

  return (
    <MuiAppBar position="static">
      <Dialog open={saveOpen} onClose={() => setSaveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Save this location</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Name (optional)"
            placeholder="e.g. Seahorse Valley"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveConfirm()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveConfirm}>Save</Button>
        </DialogActions>
      </Dialog>
      <ExportDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <Toolbar />
      <MuiDrawer
        variant="permanent"
        anchor={isMobileScreen ? "bottom" : "left"}
        open={true}
        PaperProps={{
          elevation: 4,
          style: { overflowX: "hidden", marginTop: 64 },
        }} // Added marginTop to make space for the AppBar
      >
        <Paper
          sx={{
            display: "flex",
            backgroundColor: theme.palette.white.main,
            position: "relative",
            flexDirection: isMobileScreen ? "row" : "column",
            width: isMobileScreen ? "100%" : 48,
            height: isMobileScreen ? 48 : "100%",
            alignItems: isMobileScreen ? "center" : "initial", // Changed to always center vertically
            justifyContent: isMobileScreen ? "space-between" : "initial", // Centered on desktop
            padding: 0,
          }}
        >
          {tasks.map((task) => (
            <Task {...task} key={task.label} />
          ))}
        </Paper>
      </MuiDrawer>
    </MuiAppBar>
  );
}
