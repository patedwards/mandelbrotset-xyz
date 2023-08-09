import React from "react";
import {
  Stack,
  Box,
  IconButton,
  Button,
  Accordion,
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

export const taskNames = {
  coordinateSetter: "COORDINATE_SETTER",
  styleSetter: "STYLE_SETTER",
  parametersSetter: "PARAMETERS_SETTER",
};

const Controls = ({
  parametersActivity,
  setParametersFormSubmit,
  colors,
  setColors,
  setGradientFunction,
  handleCloseControls,
  autoScaleMaxiterations,
  setAutoScaleMaxIterations,
}) => {
  const isScreenWidthLessThan400 = useMediaQuery("(max-width:400px)");
  const theme = useTheme();

  const renderColorSquares = () => (
    <Box display="flex">
      {["start", "middle", "end"].map((key) => (
        <Box
          key={key}
          bgcolor={colors[key].hex}
          width={24}
          height={24}
          mr={1}
          border={1}
          borderColor="black"
        />
      ))}
    </Box>
  );

  return (
    <Box
      sx={{
        width: isScreenWidthLessThan400 ? "100%" : "100",
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
              <Typography>Color Styler</Typography>
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
                    onChange={(e) =>
                      setAutoScaleMaxIterations(e.target.checked)
                    }
                    name="autoScaleMaxiterationsToggle"
                    color="primary"
                  />
                }
                label="Auto Scale Max Iterations"
              />
              <MaxIterationsSetter
                {...{
                  ...parametersActivity,
                  formSubmit: setParametersFormSubmit,
                  disabled: autoScaleMaxiterations,
                }}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Close Button at the bottom */}
        <Box mt={2} display="flex" justifyContent="center" width="100%">
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloseIcon />}
            onClick={handleCloseControls}
            size="small"
          >
            Close
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default Controls;
