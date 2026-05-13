import * as React from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

// A controlled wrapper around MUI's Select.
//
// `items` is `[{ label, name }]`; the dropdown's selection is driven by the
// `value` prop (matched against each item's `name`), so when the underlying
// state changes — from a URL param, a settings restore, or anywhere else — the
// dropdown shows the right entry. The previous version kept its own index
// state and ignored `value`, so it always read "Standard" no matter what was
// actually selected.
export default function BasicSelect({ items, handleSelection, value }) {
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.name === value)
  );

  const handleChange = (event) => {
    const i = Number(event.target.value);
    handleSelection(items[i]);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth sx={{ color: "#00000000" }}>
        <Select
          labelId="gradient-function-select-label"
          id="gradient-function-select"
          value={selectedIndex}
          onChange={handleChange}
          variant="standard"
        >
          {items.map((item, i) => (
            <MenuItem key={item.name ?? i} value={i}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
