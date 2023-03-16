import * as React from "react";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import { Toolbar } from "@mui/material";
import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import useMediaQuery from "@mui/material/useMediaQuery";

const Tool = (tool) => {
  return (
    <ListItem key={tool.label} disablePadding sx={{ display: "block" }}>
      <ListItemButton
        {...tool}
        sx={{
          minHeight: 48,
          justifyContent: "initial",
          px: 2.5,
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: 3,
            justifyContent: "center",
          }}
        >
          <tool.icon />
        </ListItemIcon>
      </ListItemButton>
    </ListItem>
  );
};

// The TaskDrawer component is a drawer that contains the tools for editing the Mandelbrot set.
// It is a list of buttons that can be clicked to change the Mandelbrot set.
// It sits on the left side of the screen when the screen is wide enough, and on the bottom when the screen is narrow.
export default function TaskDrawer({ editTools }) {
  const isScreenWidthLessThan400 = useMediaQuery("(max-width:400px)");

  return (
    <MuiAppBar>
      <Toolbar />
      <MuiDrawer
        variant="permanent"
        anchor={isScreenWidthLessThan400 ? "bottom" : "left"}
        open={true}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: isScreenWidthLessThan400 ? "row" : "column",
            width: isScreenWidthLessThan400 ? "100%" : 60,
            height: isScreenWidthLessThan400 ? 48 : "100%",
            alignItems: isScreenWidthLessThan400 ? "center" : "center",
            justifyContent: isScreenWidthLessThan400 ? "center" : "left",
            paddingTop: isScreenWidthLessThan400 ? 0 : 8,
          }}
        >
          {editTools.map((tool) => (
            <Tool {...tool} key={tool.label}/>
          ))}
        </Box>
      </MuiDrawer>
    </MuiAppBar>
  );
}
