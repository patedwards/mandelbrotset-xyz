import * as React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { GithubPicker } from "react-color";
import Stack from "@mui/material/Stack";

export default function ColorToggleButton({ colors, setColors }) {
  const [alignment, setAlignment] = React.useState("start");
  const [chosen, setChosen] = React.useState("start");

  const handleChange = (event, newAlignment) => {
    console.log(event);
    setAlignment(newAlignment);
    setChosen(event.target.value);
  };

  React.useEffect(() => {
    console.log(chosen, colors[[chosen]]);
  }, [chosen]);

  const handleColorChange = color => {
    console.log(color, colors[[chosen]]);
    setColors({ ...colors, [chosen]: {...color.rgb, hex: color.hex} });
  };

  console.log(colors[["start"]].hex)

  return (
    <Stack>
      <ToggleButtonGroup
        color="primary"
        value={alignment}
        exclusive
        onChange={handleChange}
        aria-label="Platform"
        background={colors[[chosen]].hex}
      >
        <ToggleButton
          value="start"
          sx={{
            background: colors[["start"]].hex
          }}
        >
          Start
        </ToggleButton>
        <ToggleButton value="middle" sx={{
            background: colors[["middle"]].hex
          }}>Middle</ToggleButton>
        <ToggleButton value="end" sx={{
            background: colors[["end"]].hex
          }}>End</ToggleButton>
      </ToggleButtonGroup>
      <GithubPicker
        triangle="hide"
        color={colors[[chosen]]}
        onChange={handleColorChange}
      />
    </Stack>
  );
}
