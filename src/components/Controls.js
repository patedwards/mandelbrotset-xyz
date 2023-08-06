import React from "react";
import { Stack, Box, IconButton, Button } from "@mui/material";  // added Button
import CloseIcon from "@mui/icons-material/Close";
import useMediaQuery from "@mui/material/useMediaQuery";
import CoordinateSetter from "./CoordinateSetter";
import GradientStyler from "./GradientStyler";

import { useTheme } from "@mui/material/styles";

export const taskNames = {
  coordinateSetter: "COORDINATE_SETTER",
  styleSetter: "STYLE_SETTER",
  parametersSetter: "PARAMETERS_SETTER",
};

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
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: isScreenWidthLessThan400? "100%" : "auto",
        height: isScreenWidthLessThan400 ? "auto" : "auto",
        maxHeight: "calc(100vh - 72px)",
        position: "fixed",
        zIndex: 1000,
        left: isScreenWidthLessThan400 ? null : 60,
        top: isScreenWidthLessThan400 ? "auto" : 72,
        bottom: isScreenWidthLessThan400 ? 60 : null,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: 1,
        backgroundColor: theme.palette.white.main,
        boxShadow: 1,
        borderRadius: 0,
        opacity: 1,
      }}
    >
      <Stack spacing={2}>
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

        {/* Close Button at the bottom */}
        <Box mt={2} display="flex" justifyContent="center" width="100%"> {/* Flexbox to center the button */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloseIcon />}
            onClick={handleCloseControls}
          >
            Close
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default Controls;
