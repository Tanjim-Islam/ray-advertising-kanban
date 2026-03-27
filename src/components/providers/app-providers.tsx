"use client";

import {
  ThemeProvider,
  createTheme,
  type PaletteMode,
} from "@mui/material/styles";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  COLOR_MODE_STORAGE_KEY,
  resolveColorMode,
  type ColorMode,
} from "@/lib/utils/theme";

interface ColorModeContextValue {
  mode: ColorMode;
  toggleMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue | null>(null);

function createMuiTheme(mode: PaletteMode) {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: "#2563eb",
      },
      secondary: {
        main: mode === "dark" ? "#94a3b8" : "#6b7280",
      },
      background: {
        default: mode === "dark" ? "#0b1020" : "#f5f6f8",
        paper: mode === "dark" ? "#121a2b" : "#ffffff",
      },
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: "var(--font-manrope), sans-serif",
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ":root": {
            colorScheme: mode,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: "none",
            backgroundColor: "var(--surface-raised)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          },
        },
      },
    },
  });
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ColorMode>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const rootMode = document.documentElement.dataset.theme;
    const stored = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);

    return resolveColorMode(stored ?? rootMode);
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  }, [mode]);

  const muiTheme = useMemo(() => createMuiTheme(mode), [mode]);

  return (
    <ColorModeContext.Provider
      value={{
        mode,
        toggleMode: () => {
          setMode((current) => (current === "light" ? "dark" : "light"));
        },
      }}
    >
      <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  const context = useContext(ColorModeContext);

  if (!context) {
    throw new Error("AppProviders is missing from the component tree.");
  }

  return context;
}
