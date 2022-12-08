import * as React from "react";
import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { useState } from "react";

export default function BasicSelect({ items, handleSelection }) {
  const [value, setValue] = useState(0);

  const handleChange = event => {
      handleSelection(items[event.target.value]);
      setValue(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth sx={{color: "#00000000"}}>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={value}
          onChange={handleChange}
          variant="standard"
        >
          {items.map((item, i) => (
            <MenuItem key={i} value={i}>
              {item.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
