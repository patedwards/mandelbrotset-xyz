import TextField from "@mui/material/TextField";
import Drawer from "@mui/material/Drawer";

export default ({scale, maxIterations, setScale, setMaxIterations}) => {
  return <Drawer anchor={"right"} open={true} variant="permanent">
    <TextField value={scale} onChange={event => setScale(event.target.value)} />
    <TextField
      value={maxIterations}
      onChange={event => setMaxIterations(event.target.value)}
    />
  </Drawer>;
};
