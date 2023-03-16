import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import List from "@mui/material/List";
import { Toolbar } from "@mui/material";
import Box from "@mui/material/Box";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import useMediaQuery from "@mui/material/useMediaQuery";

const drawerWidth = 48;

const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

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
export default function MiniDrawer({ editTools }) {
  const theme = useTheme();
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
            <Tool {...tool} />
          ))}
        </Box>
      </MuiDrawer>
    </MuiAppBar>
  );
}
