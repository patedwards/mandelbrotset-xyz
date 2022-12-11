import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import PaletteIcon from "@mui/icons-material/Palette";
import ScreenshotMonitorIcon from '@mui/icons-material/ScreenshotMonitor';

export default function ButtonAppBar({stylebarOpen, setStylebarOpen}) {
  return (
    <AppBar position="absolute" sx={{ top: 0 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Mandelbrotset.xyz
        </Typography>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <ScreenshotMonitorIcon />
        </IconButton>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
          onClick={() => {setStylebarOpen(!stylebarOpen)}}
        >
          <PaletteIcon />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}
