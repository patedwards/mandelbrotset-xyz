import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
import LibraryCard from "./LibraryCard";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#ffffff00", //theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary
}));

function BasicGrid() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={2}>
        <Grid xs={8}>
          <Item>
            <LibraryCard />
          </Item>
        </Grid>
        <Grid xs={4}>
          <Item>
            <LibraryCard />
          </Item>
        </Grid>
        <Grid xs={4}>
          <Item>
            <LibraryCard />
          </Item>
        </Grid>
        <Grid xs={8}>
          <Item>
            <LibraryCard />
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
}

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "60%",
  height: "60%",
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4
};

export default function BasicModal({ libraryOpen, setLibraryOpen }) {
  const handleOpen = () => setLibraryOpen(true);
  const handleClose = () => setLibraryOpen(false);

  return (
    <div>
      <Modal
        open={libraryOpen}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style} style={{maxHeight: '100vh', overflow: 'auto'}}>
          <BasicGrid />
        </Box>
      </Modal>
    </div>
  );
}
