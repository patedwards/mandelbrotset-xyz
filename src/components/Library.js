import * as React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Grid from '@mui/material/Unstable_Grid2';
import LibraryCard from "./LibraryCard";
import { styled } from '@mui/material/styles';


const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: "60%",
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '60vh', overflow: 'auto'
};

const Item = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default function BasicModal({ libraryOpen, setLibraryOpen, views }) {
  const handleClose = () => setLibraryOpen(false);

  return (
    <Modal
      open={libraryOpen}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={style}>
        <Grid container rowSpacing={2} columnSpacing={2}>
          {views.map(view => <Grid key={view.imgPath}>
            <Item><LibraryCard {...view} /></Item>
          </Grid>)}
        </Grid>
      </Box>
    </Modal>
  );
}