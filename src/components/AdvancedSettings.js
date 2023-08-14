import { Box, FormControlLabel, Switch } from "@mui/material";
import { useGL } from "../hooks/state";

const GLToggle = () => {
  const [glInUse, setGLInUse] = useGL();

  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <FormControlLabel
        control={
          <Switch
            checked={glInUse}
            onChange={(e) => setGLInUse(e.target.checked)}
            name="useGlForCalculationToggle"
            color="primary"
          />
        }
        label="Use GL for calculation (up to zoom level 20)"
      />
    </Box>
  );
};

export default GLToggle;
