import React, { useState } from "react";
import {
  Stack,
  Box,
  Drawer,
  Button,
  Accordion,
  IconButton,
  AccordionSummary,
  AccordionDetails,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import { useIsMobile } from "../hooks/state";

const ControlAccordion = ({
  handleCloseControls,
  activities
}) => {
  const [drawerHeight, setDrawerHeight] = useState("half");
  const isMobile = useIsMobile();
  const theme = useTheme();

  const drawerStyles = {
    height: drawerHeight === "half" ? "50vh" : "100vh",
    width: "100%",
    overflow: "auto",
  };

  const renderDrawerControls = () => (
    <Box
      display="flex"
      direction="row"
      justifyContent="space-between"
      width="100%"
      p={0}
    >
      <Button
        onClick={() =>
          setDrawerHeight((prev) => (prev === "half" ? "full" : "half"))
        }
      >
        {drawerHeight === "half" ? "Expand" : "Shrink"}
      </Button>
    </Box>
  );

  const renderContent = () => (
    <Stack spacing={0} alignContent="center" justifyContent="center">
      {activities.map(({ label, component: Component }) => (
        <Accordion key={label}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`${label}-content`}
            id={`${label}-header`}
            key={`${label}-activity`}
          >
            <Typography>{label}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Component />
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );

  if (isMobile ) {
    return (
      <Drawer
        anchor="bottom"
        open={true} // Adjust based on when you want the drawer to be open
        variant="persistent"
      >
        <Box mt={2} display="flex" justifyContent="center" width="100%">
          <IconButton
            aria-label="close-controls"
            onClick={handleCloseControls}
            sx={{
              position: "absolute",
              top: 8, // Adjust this value for proper positioning
              right: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={drawerStyles}>
          {renderDrawerControls()}
          {renderContent()}
        </Box>
      </Drawer>
    );
  }

  return (
    <Box
      sx={{
        width: "auto",
        height: "auto",
        maxHeight: "80%",
        overflow: "hidden",
        position: "fixed",
        zIndex: 1000,
        left: 60,
        top: theme.structure.appBarHeight + 4,
        bottom: null,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 0,
        backgroundColor: theme.palette.white.main,
        boxShadow: 1,
        borderRadius: 0,
        opacity: 1,
        pt: 4,
      }}
    >
      <Box mt={2} display="flex" justifyContent="center" width="100%">
        <IconButton
          aria-label="close-controls"
          onClick={handleCloseControls}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 2, // ensure it stays above content
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Box
        sx={{
          overflowY: "auto", // Enables vertical scrolling
          width: "100%", // Full width of parent
          height: "100%", // Full height of parent
          pt: 0,
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default ControlAccordion;
