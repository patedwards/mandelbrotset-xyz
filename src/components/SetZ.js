import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";


const controls = ({
    setZOpen, z, setZ
}) => {
  return (
    <div>
      {setZOpen? 
      <Box
        sx={{
          zIndex: 999999,
          position: "absolute",
          right: 16,
          width: 228,
          bottom:72 
        }}
      >
        <Paper sx={{ padding: 1, borderRadius: 3 }}>
          <Stack spacing={1} alignItems="left">
            <Stack direction="row">
              <TextField
                type="number"
                size="small"
                value={z.x}
                onChange={event => setZ({...z, x: event.target.value})}
              />
              <TextField
                type="number"
                size="small"
                value={z.y}
                onChange={event => setZ({...z, y: event.target.value})}
              />
            </Stack>
          </Stack>
        </Paper>
      </Box> : null}
    </div>
  );
};

export default controls;
