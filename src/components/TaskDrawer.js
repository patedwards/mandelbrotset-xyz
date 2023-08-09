import * as React from "react";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import { Toolbar } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import useMediaQuery from "@mui/material/useMediaQuery";
import Paper from "@mui/material/Paper";

import { useTheme } from "@mui/material/styles"; // Import the useTheme hook

const Tool = (tool) => {
  const theme = useTheme();

  const isMobile = useMediaQuery("(max-width:600px)");

  // Tool content for mobile and desktop
  const toolContent = (
    <>
      <ListItemIcon
        sx={{
          minWidth: 0,
          justifyContent: "center",
          color: theme.palette.primary.main,
        }}
      >
        <tool.icon />
      </ListItemIcon>
      {isMobile && <div>{tool.label}</div>} {/* Render label only on mobile */}
    </>
  );

  return (
    <ListItem key={tool.label} disablePadding>
      {isMobile ? (
        <ListItemButton
          {...tool}
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
          {toolContent}
        </ListItemButton>
      ) : (
        <Tooltip
          title={tool.label}
          placement="right"
        >
          <ListItemButton
            {...tool}
            sx={{
              width: "auto",
              height: 48,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "0 0.75rem",
            }}
          >
            {toolContent}
          </ListItemButton>
        </Tooltip>
      )}
    </ListItem>
  );
};

export default function TaskDrawer({ editTools }) {
  const isMobileScreen = useMediaQuery("(max-width:600px)");
  const theme = useTheme();
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
          {editTools.map((tool) => (
            <Tool {...tool} key={tool.label} />
          ))}
        </Paper>
      </MuiDrawer>
    </MuiAppBar>
  );
}
