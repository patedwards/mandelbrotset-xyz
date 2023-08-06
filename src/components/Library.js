import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  Grid,
  IconButton,
  Button,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { useStore } from "../hooks/store";

import LibraryCard from "./LibraryCard";

const ImageViewerDialog = ({
  libraryOpen,
  setLibraryOpen,
  handleLibrarySelect,
  handleShare,
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSnap, setSelectedSnap] = useState(null);
  const [itemName, setItemName] = useState("");

  const { library, removeLibraryItem, updateLibraryItem, syncLibrary } = useStore();

  useEffect(() => {
    if (libraryOpen) {
      syncLibrary();
    }
  }, [libraryOpen, syncLibrary]);

  const handleCardClick = ({
    viewState,
    maxIterations,
    colors,
    gradientFunction,
  }) => {
    // Set the viewState when a card is clicked
    console.log("handleCardClick", maxIterations);
    handleLibrarySelect({
      newViewState: viewState,
      newColors: colors,
      newGradientFunction: gradientFunction,
      newMaxIterations: maxIterations,
    });
    setLibraryOpen(false);
  };

  const handleDelete = (snap) => {
    removeLibraryItem(snap.imageLocation);
  };

  const handleEdit = (snap) => {
    setSelectedSnap(snap);
    setItemName(snap.name || ""); // You might want to store the name in each snap object
    setEditDialogOpen(true);
  };

  const saveName = () => {
    updateLibraryItem(selectedSnap.imageLocation, itemName);
    setEditDialogOpen(false);
  };

  return (
    <>
      <Dialog
        open={libraryOpen}
        fullScreen={fullScreen}
        maxWidth="sm"
        fullWidth
        onClose={() => setLibraryOpen(false)}
      >
        <DialogTitle>
          Image Library
          <IconButton
            edge="end"
            color="inherit"
            onClick={() => setLibraryOpen(false)}
            aria-label="close"
            style={{ position: "absolute", right: theme.spacing(1) }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {library.map((snap) => (
              <Grid item xs={12} sm={6} md={4} key={snap.imageLocation}>
                <LibraryCard
                  snap={snap}
                  handleCardClick={handleCardClick}
                  handleShare={handleShare}
                  handleDelete={handleDelete}
                  handleEdit={handleEdit}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit Snapshot Name</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={saveName} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ImageViewerDialog;
