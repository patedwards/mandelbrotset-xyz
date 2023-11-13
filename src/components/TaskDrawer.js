import LibraryIcon from "@mui/icons-material/Collections";
import PaletteIcon from "@mui/icons-material/Palette";
import InfoIcon from "@mui/icons-material/Info";
import SnapIcon from "@mui/icons-material/Save";
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
import {
  useIsMobile,
  useMapRef,
  useShowAlert,
  useShowControls,
  useLibraryOpen,
  useShowInfo,
  useStateUrl
} from "../hooks/state";

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
  const url = useStateUrl()

  const handleSaveButtonClick = () => {
    if (mapRef.current) {
      mapRef.current.captureThumbnail(url);
    }

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
      label: "Save",
      onClick: handleSaveButtonClick,
      icon: SnapIcon,
    },
    {
      label: "Image Library",
      onClick: () => setLibraryOpen(true),
      icon: LibraryIcon,
    },
  ];

  return (
    <MuiAppBar position="static">
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
