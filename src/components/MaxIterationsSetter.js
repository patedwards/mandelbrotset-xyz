import { Stack, TextField, Box, IconButton, Typography } from "@mui/material";
import { useState } from "react";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import { useAutoScaleMaxIterations, useMaxIterations } from "../hooks/state";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";


const MaxIterationsSetter = () => {
  const [maxIterations, setMaxIterations] = useMaxIterations();
  const [maxIterationsValue, setMaxIterationsValue] = useState(maxIterations);
  const [autoScaleMaxiterations, setAutoScaleMaxIterations] = useAutoScaleMaxIterations(); 
  return (
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

      <Box
        sx={{
          zIndex: 999,
          backgroundColor: "white",
          padding: 1,
          opacity: autoScaleMaxiterations ? 0.5 : 1,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2">{"Max iterations"}</Typography>
          <TextField
            value={maxIterationsValue}
            disabled={autoScaleMaxiterations}
            variant="standard"
            onChange={(e) => Math.max(0, setMaxIterationsValue(e.target.value))}
            type="number"
            inputProps={{
              min: 0,
              step: "100",
            }}
          />
          <IconButton
            onClick={() => setMaxIterations(maxIterationsValue)}
            disabled={autoScaleMaxiterations}
          >
            <KeyboardReturnIcon />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default MaxIterationsSetter;
