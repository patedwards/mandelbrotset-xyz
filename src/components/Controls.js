import React from "react";
import { Stack, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import useMediaQuery from "@mui/material/useMediaQuery";
import CoordinateSetter from "./CoordinateSetter";
import GradientStyler from "./GradientStyler";


export const taskNames = {
    coordinateSetter: "COORDINATE_SETTER",
    styleSetter: "STYLE_SETTER",
    parametersSetter: "PARAMETERS_SETTER",
  };

// The controls component is a container for the tools that are available to the user
// When the screen is narrow, the controls are just to the left of the drawer.
// When the screen is wide, the controls are in middle of the screen, and the drawer is on the bottom
// There's a circle x button in the top right of the controls that closes the controls
const Controls = ({
    activeTask,
    setZActivity,
    setZActivityFormSubmit,
    parametersActivity,
    setParametersFormSubmit,
    colors,
    setColors,
    setGradientFunction,
    handleCloseControls,
  }) => {
    const isScreenWidthLessThan400 = useMediaQuery("(max-width:400px)");
    return (
      <Box
        sx={{
          width: 360,
          position: "absolute",
          zIndex: 1000,
          left: isScreenWidthLessThan400 ? 0 : 72,
          top: isScreenWidthLessThan400 ? null : 72,
          bottom: isScreenWidthLessThan400 ? 40 : null,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          p: 2,
          backgroundColor: "white",
          boxShadow: 1,
          borderRadius: 1,
          opacity: 0.9,
        }}
      >
        <Box sx={{ position: "absolute", top: 0, right: 0, p: 1, zIndex: 10000 }}>
          <IconButton
            onClick={handleCloseControls}
            sx={{ backgroundColor: "white", borderRadius: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Stack spacing={2}>
          {activeTask === taskNames.coordinateSetter ? (
            <CoordinateSetter
              {...{ ...setZActivity, formSubmit: setZActivityFormSubmit }}
            />
          ) : null}
          {activeTask === taskNames.styleSetter ? (
            <GradientStyler {...{ colors, setColors, setGradientFunction }} />
          ) : null}
          {activeTask === taskNames.parametersSetter ? (
            <CoordinateSetter
              {...{
                ...parametersActivity,
                formSubmit: setParametersFormSubmit,
              }}
            />
          ) : null}
        </Stack>
      </Box>
    );
  };
  

export default Controls;