import TextField from "@mui/material/TextField";
import Drawer from "@mui/material/Drawer";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ColorToggleButton from "./ColorButtons";
import Selector from "./Selector";

const gradientFunctions = [
  {
    label: "Standard",
    name: "standard"
  },
  {
    label: "Pillar maker",
    name: "pillarMaker"
  }
];

const controls = ({
  scale,
  maxIterations,
  setScale,
  setMaxIterations,
  colors,
  setColors,
  setGradientFunction,
  stylebarOpen
}) => {
  return (
    <div>
      {stylebarOpen? 
      <Box
        sx={{
          zIndex: 999999,
          position: "absolute",
          right: 16,
          width: 228,
          top:72 
        }}
      >
        <Paper sx={{ padding: 1, borderRadius: 3 }}>
          <Stack spacing={1} alignItems="left">
            <Stack direction="row">
              <TextField
                type="number"
                size="small"
                value={scale}
                onChange={event => setScale(event.target.value)}
              />
              <TextField
                type="number"
                size="small"
                value={maxIterations}
                onChange={event => setMaxIterations(event.target.value)}
              />
            </Stack>
            <ColorToggleButton {...{ colors, setColors }} />
            <Selector
              items={gradientFunctions}
              handleSelection={item => setGradientFunction(item.name)}
            />
          </Stack>
        </Paper>
      </Box> : null}
    </div>
  );
};

export default controls;
