import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Grid from '@mui/material/Unstable_Grid2';
import LibraryCard from "./LibraryCard";
import { styled } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

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
  height: '60vh', overflow: 'auto'
};

const Item = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export default function Library({ libraryOpen, setLibraryOpen, includedViews, savedViews, handleLoadView }) {
  const [value, setValue] = useState(0);
  const [views, setViews] = useState(includedViews);
  const handleClose = () => setLibraryOpen(false);

  useEffect(() => {
    setViews(value === 0 ? savedViews : includedViews)
  }, [value, includedViews, savedViews])

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Modal
      open={libraryOpen}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >

      <Box sx={style}>
        <Tabs sx={{position: "relative", top: 0}} value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label="My places" />
          <Tab label="Library" />
        </Tabs>
        <Grid container rowSpacing={2} columnSpacing={2}>
          {views.map(view => <Grid key={view.imgPath}>
            <Item><LibraryCard {...{view, handleLoadView}} /></Item>
          </Grid>)}
        </Grid>
      </Box>
    </Modal>
  );
}