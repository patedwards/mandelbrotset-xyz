import { Stack, TextField, Box, IconButton, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

const CoordinateSetter = ({ tools, formSubmit }) => {
    const [formState, setFormState] = useState(tools.reduce((a, tool) => ({ ...a, [tool.label]: tool.initialValue }), {}));
    const [activeField, setActiveField] = useState(null);

    useEffect(() => {
        setFormState(tools.reduce((a, tool) => ({ ...a, [tool.label]: tool.initialValue }), {}));
    }, [tools]);

    return (
        <Box sx={{ zIndex: 999, backgroundColor: "white", padding: 1 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                {tools.map(tool => (
                    <>
                    <Typography variant="body2">{tool.label}</Typography>
                    <TextField
                        key={tool.label}
                        size="small"
                        variant="standard"
                        sx={{width: 50}}
                        value={activeField === tool.label ? formState[tool.label] : tool.initialValue}
                        onFocus={() => setActiveField(tool.label)}
                        onBlur={() => setActiveField(null)}
                        onChange={event => setFormState({ ...formState, [tool.label]: parseFloat(event.target.value) })}
                        type="number"
                        inputProps={tool.inputProps}
                        InputLabelProps={{ shrink: true }}
                    />
                    </>
                ))}
                <IconButton onClick={() => formSubmit(formState)}>
                    <KeyboardReturnIcon />
                </IconButton>
            </Stack>
        </Box>
    );
}

export default CoordinateSetter;
