import { Stack, TextField, Box, IconButton, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";

const CoordinateSetter = ({ tools, formSubmit, disabled }) => {
  const [formState, setFormState] = useState(
    tools.reduce((a, tool) => ({ ...a, [tool.label]: tool.initialValue }), {})
  );
  const [activeField, setActiveField] = useState(null);

  useEffect(() => {
    setFormState(
      tools.reduce((a, tool) => ({ ...a, [tool.label]: tool.initialValue }), {})
    );
  }, [tools]);

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
        {tools.map((tool) => (
          <>
            <Typography variant="body2">{tool.label}</Typography>
            <TextField
              // ... other properties
              disabled={disabled}
            />
          </>
        ))}
        <IconButton onClick={() => formSubmit(formState)} disabled={disabled}>
          <KeyboardReturnIcon />
        </IconButton>
      </Stack>
    </Box>
  );
};

export default CoordinateSetter;
