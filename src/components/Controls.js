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
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import useMediaQuery from "@mui/material/useMediaQuery";
import MaxIterationsSetter from "./MaxIterationsSetter";
import { GradientFunctionSelector, ColorStyler } from "./GradientStyling";
import { useTheme } from "@mui/material/styles";

const Controls = ({
  parametersActivity,
  colors,
  setColors,
  setGradientFunction,
  handleCloseControls,
  autoScaleMaxiterations,
  setAutoScaleMaxIterations,
  setMaxIterations,
  maxIterations,
}) => {
  const [drawerHeight, setDrawerHeight] = useState("half");
  const isScreenWidthLessThan400 = useMediaQuery("(max-width:600px)");
  const theme = useTheme();

  const drawerStyles = {
    height: drawerHeight === "half" ? "50vh" : "100vh",
    width: "100%",
    overflow: "auto",
  };

  const renderColorSquares = () => (
    <Box display="flex">
      {["start", "middle", "end"].map((key) => (
        <Box
          key={key}
          bgcolor={colors[key].hex}
          width={24}
          height={24}
          mr={1}
        />
      ))}
    </Box>
  );

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
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="colorStyler-content"
          id="colorStyler-header"
        >
          <Box
            display="flex"
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            width="100%"
          >
            <Typography>Color palette</Typography>
            {renderColorSquares()}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <ColorStyler {...{ colors, setColors }} />
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="gradientFunctionSelector-content"
          id="gradientFunctionSelector-header"
        >
          <Typography>Gradient Function</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <GradientFunctionSelector
            {...{ colors, setColors, setGradientFunction }}
          />
        </AccordionDetails>
      </Accordion>

      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="maxIterationsSetter-content"
          id="maxIterationsSetter-header"
        >
          <Typography>Max Iterations</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box display="flex" flexDirection="column" alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoScaleMaxiterations}
                  onChange={(e) => setAutoScaleMaxIterations(e.target.checked)}
                  name="autoScaleMaxiterationsToggle"
                  color="primary"
                />
              }
              label="Auto Scale Max Iterations"
            />
            <MaxIterationsSetter
              {...{
                ...parametersActivity,
                disabled: autoScaleMaxiterations,
                setMaxIterations,
                maxIterations,
              }}
            />
          </Box>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );

  if (isScreenWidthLessThan400) {
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
        top: 72,
        bottom: null,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 1,
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

export default Controls;
