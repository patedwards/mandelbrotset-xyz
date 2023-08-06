import { Stack, TextField, Box, IconButton } from "@mui/material";
import { useState, useEffect } from "react";
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn';

const CoordinateSetter = ({ tools, formSubmit }) => {
    const [formState, setFormState] = useState(tools.reduce((a, tool) => ({ ...a, [tool.label]: tool.initialValue }), {}));
    const [activeField, setActiveField] = useState(null);

    useEffect(() => {
        setFormState(tools.reduce((a, tool) => ({ ...a, [tool.label]: tool.initialValue }), {}));
    }, [tools]);

    return (
        <Box sx={{ zIndex: 999, backgroundColor: "white", padding: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
                {tools.map(tool => (
                    <TextField
                        key={tool.label}
                        label={tool.label}
                        size="small"
                        value={activeField === tool.label ? formState[tool.label] : tool.initialValue}
                        onFocus={() => setActiveField(tool.label)}
                        onBlur={() => setActiveField(null)}
                        onChange={event => setFormState({ ...formState, [tool.label]: parseFloat(event.target.value) })}
                        type="number"
                        inputProps={tool.inputProps}
                        InputLabelProps={{ shrink: true }}
                    />
                ))}
                <IconButton onClick={() => formSubmit(formState)}>
                    <KeyboardReturnIcon />
                </IconButton>
            </Stack>
        </Box>
    );
}

export default CoordinateSetter;
