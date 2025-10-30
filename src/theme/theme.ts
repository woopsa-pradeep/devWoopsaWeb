import { createTheme } from "@mui/material/styles";

export const getTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: "#3C7795",
        contrastText: mode === "light" ? "#0000001f" : "#E0E0E0"
      },
      background: {
        default: mode === "light" ? "#F4F4F8" : "#000000",
        paper: mode === "light" ? "#ffffff" : "#000000",
      },
      text: {
        primary: mode === "light" ? "#000000" : "#E0E0E0",
        secondary: mode === "light" ? "rgba(66, 66, 66, 0.9)" : "#E0E0E0",
        disabled: mode === "light" ? "#717188" : "#000000",
      },
      common:{
        white: mode === "light" ? "#ffffff" : "rgb(13 13 13)",
      }
    },
    typography: {
      fontFamily: "poppins", // <-- global font
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: "background-color 0.3s, color 0.3s",
            fontFamily: "Poppins", // <-- fallback for <body>
            color: mode === "light" ? "#2c2c2c" : "#E0E0E0",
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            "&.Mui-selected": {
              backgroundColor: "#3C7795 !important",
              color: "#fff",
            },
            "&:hover": {
              backgroundColor: "#3C7795 !important",
              color: "#fff",
            },
          },
        },
      },
    },
  });
