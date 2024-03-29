import React from "react";
import SquareIcon from "@mui/icons-material/Square";
import { Stack, Box, IconButton } from "@mui/material";
import { useState, useEffect } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { GithubPicker, ChromePicker } from "react-color";
import Selector from "./Selector";
import { Button } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { TextField } from "@mui/material"; // Import TextField
import { useColors, useGradientFunction } from "../hooks/state";
// Add a new state for the Mandelbrot set color

const gradientFunctions = [
  {
    label: "Standard",
    name: "standard",
  },
  {
    label: "Fast grayscale",
    name: "rust",
  },
  {
    label: "Linear Gradient",
    name: "niceGradient",
  },
  {
    label: "Pillar maker",
    name: "pillarMaker",
  },
  {
    label: "Log",
    name: "log",
  },
  {
    label: "Square root",
    name: "sqrt",
  },
  {
    label: "Exponential",
    name: "exponential",
  },
  {
    label: "Random palette",
    name: "randomPalette",
  },
];

export const ColorStyler = () => {
  const [colors, setColors] = useColors();
  const [blackColor, setBlackColor] = useState({
    r: 0,
    g: 0,
    b: 0,
    hex: "#000000",
  });

  const [chosen, setChosen] = useState(null);
  const [showBigPicker, setShowBigPicker] = useState(false);
  const defaultColors = [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4caf50",
    "#8bc34a",
    "#cddc39",
    "#ffeb3b",
    "#ffc107",
    "#ff9800",
    "#ff5722",
    "#795548",
    "#607d8b",
  ];

  const [favorites, setFavorites] = useState(() => {
    const loadedFavorites = JSON.parse(
      localStorage.getItem("colorFavorites", "[]")
    );
    return loadedFavorites ? loadedFavorites : defaultColors;
  });

  useEffect(() => {
    localStorage.setItem("colorFavorites", JSON.stringify(favorites));
  }, [favorites]);

  const handleColorChange = (color) => {
    setColors({ ...colors, [chosen]: { ...color.rgb, hex: color.hex } });
  };

  const toggleFavorite = (color) => {
    if (favorites.includes(color.hex)) {
      setFavorites(favorites.filter((fav) => fav !== color.hex));
    } else {
      setFavorites([...favorites, color.hex]);
    }
  };

  const handleHexInputChange = (colorKey, hexValue) => {
    setColors({
      ...colors,
      [colorKey]: {
        ...colors[colorKey],
        hex: hexValue,
      },
    });
  };

  return (
    <Box
      sx={{
        zIndex: 999,
        backgroundColor: "white",
        padding: 1,
      }}
    >
      <Stack direction="column" spacing={1} alignItems="center">
        <Stack
          direction="row"
          alignItems="center"
          spacing={0}
          justifyContent="center"
        >
          {["start", "middle", "end"].map((key) => (
            <React.Fragment key={key}>
              <IconButton
                key={key + "-icon"}
                onClick={() => setChosen(chosen === key ? null : key)}
                style={{
                  backgroundColor: chosen === key ? "#eee" : "transparent",
                }}
              >
                <SquareIcon sx={{ color: colors[key].hex }} />
              </IconButton>
              {/* Input Field to accept hex input */}
              <TextField
                key={key}
                size="small"
                variant="standard"
                value={colors[key].hex}
                onFocus={() => setChosen(key)}
                onChange={(e) => handleHexInputChange(key, e.target.value)}
                inputProps={{ maxLength: 7 }} // #RRGGBB format
                sx={{ width: "80px" }} // Control the width here
              />
              {key !== "end" && <ArrowForwardIcon color="#fefefe" />}
            </React.Fragment>
          ))}
        </Stack>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0}
          justifyContent="center"
        >
          <IconButton
            onClick={() => setChosen(chosen === "black" ? null : "black")}
            style={{
              backgroundColor: chosen === "black" ? "#eee" : "transparent",
            }}
          >
            <SquareIcon sx={{ color: blackColor.hex }} />
          </IconButton>
          <TextField
            size="small"
            variant="standard"
            value={blackColor.hex}
            onFocus={() => setChosen("black")}
            onChange={(e) =>
              setBlackColor({ ...blackColor, hex: e.target.value })
            }
            inputProps={{ maxLength: 7 }} // #RRGGBB format
            sx={{ width: "80px" }} // Control the width here
          />
        </Stack>
        {chosen && (
          <>
            <GithubPicker
              triangle="hide"
              colors={favorites}
              color={colors[chosen]}
              onChange={handleColorChange}
              maxWidth="80%"
            />
            <Stack
              direction="row"
              alignItems="center"
              spacing={0}
              justifyContent="center"
            >
              <IconButton
                onClick={() => toggleFavorite(colors[chosen])}
                sx={{ color: colors[chosen].hex }}
              >
                {favorites.includes(colors[chosen].hex) ? (
                  <FavoriteIcon />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
              {showBigPicker ? (
                <Button onClick={() => setShowBigPicker(false)}>
                  Show less
                </Button>
              ) : (
                <Button onClick={() => setShowBigPicker(true)}>
                  More colors...
                </Button>
              )}
            </Stack>
            {showBigPicker && (
              <ChromePicker
                triangle="hide"
                color={colors[chosen]}
                onChange={handleColorChange}
                maxWidth="80%"
              />
            )}
          </>
        )}
      </Stack>
    </Box>
  );
};

export const GradientFunctionSelector = () => {
  const [gradientFunction, setGradientFunction] = useGradientFunction();
  return (
    <Box>
      <Selector
        label="Gradient function"
        value={gradientFunction}
        items={gradientFunctions}
        handleSelection={(item) => setGradientFunction(item.name)}
      />
    </Box>
  );
};
