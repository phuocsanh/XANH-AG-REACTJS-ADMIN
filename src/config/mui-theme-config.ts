import { createTheme } from "@mui/material/styles";

const muiTheme = createTheme({
  palette: {
    primary: {
      main: "#16a34a", // green-600
      light: "#4ade80", // green-400
      dark: "#15803d", // green-700
      contrastText: "#ffffff",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // Tắt viết hoa toàn bộ chữ để giống Ant Design
          borderRadius: 6, // Bo góc giống Ant Design
        },
      },
    },
  },
});

export default muiTheme;
