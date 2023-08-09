import { Stack, TextField, Box, IconButton, Typography } from "@mui/material";
import { useState } from "react";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";

const MaxIterationsSetter = ({
  tools,
  disabled,
  maxIterations,
  setMaxIterations,
}) => {
  console.log(maxIterations);
  const [maxIterationsValue, setMaxIterationsValue] = useState(maxIterations);

  return (
    <Box
      sx={{
        zIndex: 999,
        backgroundColor: "white",
        padding: 1,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2">{"Max iterations"}</Typography>
        <TextField
          value={maxIterationsValue}
          disabled={disabled}
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
          disabled={disabled}
        >
          <KeyboardReturnIcon />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default MaxIterationsSetter;
