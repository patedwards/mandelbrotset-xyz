import { createTheme } from "@mui/material/styles";

export default createTheme({
  palette: {
    secondary: {
      main: "#DB4C40",
    },
    primary: {
      main: "#232C33",
    },
    transparent: { main: "#00000000" },
    white: { main: "#EFEFEF" }, // ghost white
  },
  typography: {
    h6: {
      fontFamily: "Monospace",
      fontSize: 20,
    },
    h7: {
      fontFamily: "Monospace",
      fontSize: 18,
    },
  },
  structure: {
    drawerWidth: 60,
    appBarHeight: 72,
    controlsWidth: 300,
    controlsHeight: 300,
  },
});
