import * as React from "react";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import { GithubPicker } from "react-color";
import Stack from "@mui/material/Stack";
import { getContrastingTextColor } from "../utilities/styling";

export default function ColorToggleButton({ colors, setColors }) {
  const [chosen, setChosen] = React.useState("start");

  const handleChange = (event, newAlignment) => {
    setChosen(event.target.value);
  };

  React.useEffect(() => {}, [chosen, colors]);

  const handleColorChange = color => {
    console.log(color, colors[[chosen]]);
    setColors({ ...colors, [chosen]: { ...color.rgb, hex: color.hex } });
  };

  return (
    <Stack spacing={1}>
      <ButtonGroup
        color="primary"
        exclusive
        onChange={handleChange}
        aria-label="Platform"
        sx={{
          background: "#ffffff0f",
          color: "#00000000",
          width: 72 * 3
        }}
      >
        <Button
          value="start"
          size="small"
          onClick={handleChange}
          sx={{
            background: colors[["start"]].hex,
            color: getContrastingTextColor(colors[["start"]].hex),
            width: 72
          }}
        >
          Start
        </Button>
        <Button
          value="middle"
          size="small"
          onClick={handleChange}
          sx={{
            background: colors[["middle"]].hex,
            color: getContrastingTextColor(colors[["middle"]].hex),
            width: 72
          }}
        >
          Middle
        </Button>
        <Button
          value="end"
          size="small"
          onClick={handleChange}
          sx={{
            background: colors[["end"]].hex,
            color: getContrastingTextColor(colors[["end"]].hex),
            width: 72
          }}
        >
          End
        </Button>
      </ButtonGroup>
      <GithubPicker
        triangle="hide"
        color={colors[[chosen]]}
        onChange={handleColorChange}
        width={202}
      />
    </Stack>
  );
}
