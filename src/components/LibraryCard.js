import React, { useState } from "react";
import {
  Card,
  CardMedia,
  IconButton,
  Typography,
  CardActionArea,
  useTheme,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

const LibraryCard = ({
  snap,
  handleCardClick,
  handleShare,
  handleDelete,
  handleEdit,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme(); // Use the theme to access predefined color values

  return (
    <Card
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      style={{ position: "relative" }}
    >
      <CardActionArea onClick={() => handleCardClick(snap)}>
        <CardMedia
          component="img"
          image={localStorage.getItem(snap.imageLocation)}
          alt="Snapshot"
        />
      </CardActionArea>
      {isHovered && (
        <>
          {snap.name && (
            <Typography
              variant="h7"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "30px",
                width: "100%",
                color: theme.palette.common.white,
                background: "rgba(0,0,0,0)",
                padding: "5px",
                borderRadius: "0px",
              }}
            >
              {snap.name}
            </Typography>
          )}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              height: "30px",
              width: "100%",
              left: 0,
              display: "flex",
              gap: "0px",
              background: "rgba(0,0,0,0.6)", //theme.palette.white.main,
              borderRadius: "0px",
              padding: "1px",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            <IconButton
              size="small"
              onClick={() =>
                handleShare({
                  viewState_: snap.viewState,
                  colors_: snap.colors,
                  maxIterations: snap.maxIterations,
                  gradientFunction_: snap.gradientFunction,
                })
              }
              sx={{
                color: (theme) => theme.palette.white.main,
              }}
            >
              <ShareIcon />
            </IconButton>
            <IconButton
              onClick={() => handleDelete(snap)}
              sx={{
                color: (theme) => theme.palette.white.main,
              }}
            >
              <DeleteIcon />
            </IconButton>
            <IconButton
              onClick={() => handleEdit(snap)}
              sx={{
                color: (theme) => theme.palette.white.main,
              }}
            >
              <EditIcon />
            </IconButton>
          </div>
        </>
      )}
    </Card>
  );
};

export default LibraryCard;
