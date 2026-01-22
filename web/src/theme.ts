import { createTheme } from '@mui/material/styles'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import '@fontsource/ibm-plex-sans/700.css'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2f6f4e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#c26a2e',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f6f2ea',
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2328',
      secondary: '#4f5b66',
    },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.2rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.8rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.4rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.2rem',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            'radial-gradient(circle at top, rgba(242, 231, 213, 0.8), transparent 55%), #f6f2ea',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: '1px solid rgba(31, 35, 40, 0.08)',
          boxShadow: '0 20px 50px rgba(31, 35, 40, 0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          paddingInline: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
  },
})

export default theme
