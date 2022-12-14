import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";


const controls = ({
    setZOpen, z, handleSetZ
}) => {
  return (
    <div>
      {setZOpen? 
      <Box
        sx={{
          zIndex: 999999,
          position: "absolute",
          left: 0,
          width: 228,
          top:64 
        }}
      >
        <Paper sx={{ padding: 1, borderRadius: 0 }}>
          <Stack spacing={1} alignItems="left">
            <Stack direction="row">
              <TextField
                type="number"
                size="small"
                value={z.x}
                onChange={event => handleSetZ({...z, x: event.target.value})}
              />
              <TextField
                type="number"
                size="small"
                value={z.y}
                onChange={event => handleSetZ({...z, y: event.target.value})}
              />
            </Stack>
          </Stack>
        </Paper>
      </Box> : null}
    </div>
  );
};

export default controls;
