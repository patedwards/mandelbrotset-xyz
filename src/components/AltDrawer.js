import React, { useState } from "react";
import {
  Drawer,
  List,
  Button,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  IconButton,
} from "@mui/material";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import { Toolbar } from "@mui/material";

import PaletteIcon from "@mui/icons-material/Palette";
import SaveIcon from "@mui/icons-material/Save";
import FunctionsIcon from "@mui/icons-material/Functions";

const MyDrawerComponent = ({ toggleDrawer, onSave }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [colors, setColors] = useState({
    color1: "#ff0000",
    color2: "#00ff00",
    color3: "#0000ff",
  });
  const [math, setMath] = useState("");
  const gradientFunctions = ["Function 1", "Function 2", "Function 3"];
  const [selectedGradient, setSelectedGradient] = useState(
    gradientFunctions[0]
  );

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <MuiAppBar position="static">
      <Toolbar />
      <MuiDrawer
        variant="permanent"
        anchor={"left"}
        open={true}
        PaperProps={{
          elevation: 4,
          style: { overflowX: "hidden", marginTop: 64 },
        }} // Added marginTop to make space for the AppBar
      >
        <List>
          <ListItem button onClick={handleMenuClick}>
            <ListItemIcon>
              <PaletteIcon />
            </ListItemIcon>
            <ListItemText primary="Style" />
          </ListItem>

          <Menu
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem>
              Gradient Function:
              <select
                value={selectedGradient}
                onChange={(e) => setSelectedGradient(e.target.value)}
              >
                {gradientFunctions.map((func, index) => (
                  <option key={index} value={func}>
                    {func}
                  </option>
                ))}
              </select>
            </MenuItem>
            {["color1", "color2", "color3"].map((colorKey) => (
              <MenuItem key={colorKey}>
                <input
                  type="color"
                  value={colors[colorKey]}
                  onChange={(e) =>
                    setColors((prevColors) => ({
                      ...prevColors,
                      [colorKey]: e.target.value,
                    }))
                  }
                />
              </MenuItem>
            ))}
          </Menu>

          <ListItem>
            <ListItemIcon>
              <FunctionsIcon />
            </ListItemIcon>
            <ListItemText primary="Math" />
            <TextField
              value={math}
              onChange={(e) => setMath(e.target.value)}
              label="Enter Math"
            />
          </ListItem>

          <ListItem button onClick={onSave}>
            <ListItemIcon>
              <SaveIcon />
            </ListItemIcon>
            <ListItemText primary="Save" />
          </ListItem>
        </List>
      </MuiDrawer>
    </MuiAppBar>
  );
};

export default MyDrawerComponent;
