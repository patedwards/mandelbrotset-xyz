import { createTheme } from '@mui/material/styles';

export default createTheme({
  palette: {
    secondary: {
      main: '#DB4C40',
    },
    primary: {
      main: '#232C33',
    },
    transparent: {main: "#00000000"}
  },
  typography: {
    h6: {
      fontFamily: "Monospace",
      fontSize: 20
    },
  },
});