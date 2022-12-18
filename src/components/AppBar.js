import * as React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import IconButton from '@mui/material/IconButton';

export default function ButtonAppBar({ z, zoom, showCoordinateSetter, setShowCoordinateSetter }) {
  const digits = zoom < 5 ? 2 :
    zoom < 10 ? 4 : 10
  // TODO: use the recipe concept to create the button
  return (
    <AppBar position="absolute" sx={{ top: 0 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Mandelbrotset.xyz
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
