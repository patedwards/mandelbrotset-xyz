import { Stack, TextField, Box } from "@mui/material";
import { useState, useEffect } from "react";
import { Button } from "@mui/material"

const CoordinateSetter = ({ tools, formSubmit }) => {
    const [formState, setFormState] = useState(tools.reduce((a, tool) => ({ ...a, [tool.label]: tool.initialValue }), {}))
    const [activeField, setActiveField] = useState(null)

    useEffect(() => {
        setFormState(tools.reduce((a, tool) => ({ ...a, [tool.label]: tool.initialValue }), {}))
    }, [tools])

    // TODO: refactor the two TextField variants into named components

    return (
        <Box sx={{ zIndex: 999, backgroundColor: "white", padding: 2 }}>
            <Stack spacing={1}>
                {tools.map(tool => activeField === tool.label ? <TextField
                    key={tool.label}
                    label={tool.label}
                    size="small"
                    defaultValue={tool.initialValue}
                    onBlur={() => {
                        setActiveField(null)
                    }}
                    type="number"
                    inputProps={tool.inputProps}
                    onChange={event => { setFormState({ ...formState, [tool.label]: parseFloat(event.target.value) }) }}
                    InputLabelProps={{
                        shrink: true,
                    }}
                /> : <TextField
                    key={tool.label}
                    label={tool.label}
                    size="small"
                    value={tool.initialValue}
                    onFocus={() => {
                        setActiveField(tool.label)
                    }}
                    type="number"
                    inputProps={tool.inputProps}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />)}
                <Button variant="outlined" onClick={() => formSubmit(formState)}>Apply</Button>
            </Stack>
        </Box>
    )
}

export default CoordinateSetter;