import TextField from "@mui/material/TextField";
import Drawer from "@mui/material/Drawer";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ColorToggleButton from "./ColorButtons";
import Selector from "./Selector";

const gradientFunctions = [
  {
    label: "Standard", name: "standard"
  },
  {
      label: "Pillar maker", name: "pillarMaker"
  }
];

export default ({
  scale,
  maxIterations,
  setScale,
  setMaxIterations,
  colors,
  setColors,
  setGradientFunction
}) => {
  return (
    <div>
      <Box
        sx={{
          zIndex: 999999,
          position: "absolute",
          left: 32,
          top: 32,
        }}
      >
        <Paper sx={{}}>
          <Stack>
            <TextField
              value={scale}
              onChange={event => setScale(event.target.value)}
            />
            <TextField
              value={maxIterations}
              onChange={event => setMaxIterations(event.target.value)}
            />
            <ColorToggleButton {...{ colors, setColors }} />
            <Selector items={gradientFunctions} handleSelection={item => setGradientFunction(item.name)}/>
          </Stack>
        </Paper>
      </Box>
      <Drawer anchor={"right"} open={true} variant="permanent"></Drawer>
    </div>
  );
};
