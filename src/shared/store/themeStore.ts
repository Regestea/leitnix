import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeName = "Light" | "Dark" | "TomorrowNight";

// ─── Font Family ──────────────────────────────────────────────────────────────
export type FontFamily =
  // Custom (Leitnix @font-face)
  | "comic"
  | "angelina"
  // Generic stacks
  | "sans"
  | "serif"
  | "mono"
  // Common web fonts
  | "inter"
  | "poppins"
  | "vazirmatn"
  | "roboto"
  | "nunito"
  | "playfair"
  | "merriweather"
  | "source-code"
  | "jetbrains";

const FONT_FAMILY_VAR: Record<FontFamily, string> = {
  "comic":        "--font-comic",
  "angelina":     "--font-angelina",
  "sans":         "--font-sans",
  "serif":        "--font-serif",
  "mono":         "--font-mono",
  "inter":        "--font-inter",
  "poppins":      "--font-poppins",
  "vazirmatn":    "--font-vazirmatn",
  "roboto":       "--font-roboto",
  "nunito":       "--font-nunito",
  "playfair":     "--font-playfair",
  "merriweather": "--font-merriweather",
  "source-code":  "--font-source-code",
  "jetbrains":    "--font-jetbrains",
};

// ─── Font Size ────────────────────────────────────────────────────────────────
export type FontSize =
  | "xx-small"   // 0.5rem   (~8px)
  | "x-small"    // 0.625rem (~10px)
  | "small"      // 0.75rem  (~12px)
  | "medium"     // 1rem     (~16px) ← browser default
  | "large"      // 1.125rem (~18px)
  | "x-large"    // 1.5rem   (~24px)
  | "xx-large"   // 2rem     (~32px)
  | "xxx-large"; // 3rem     (~48px)

const FONT_SIZE_VAR: Record<FontSize, string> = {
  "xx-small":  "--fs-xx-small",
  "x-small":   "--fs-x-small",
  "small":     "--fs-small",
  "medium":    "--fs-medium",
  "large":     "--fs-large",
  "x-large":   "--fs-x-large",
  "xx-large":  "--fs-xx-large",
  "xxx-large": "--fs-xxx-large",
};

// ─── Font Weight ──────────────────────────────────────────────────────────────
export type FontWeight =
  | "thin"         // 100
  | "extra-light"  // 200
  | "light"        // 300
  | "normal"       // 400 ← browser default
  | "medium"       // 500
  | "semi-bold"    // 600
  | "bold"         // 700
  | "extra-bold"   // 800
  | "black";       // 900

const FONT_WEIGHT_VAR: Record<FontWeight, string> = {
  "thin":        "--fw-thin",
  "extra-light": "--fw-extra-light",
  "light":       "--fw-light",
  "normal":      "--fw-normal",
  "medium":      "--fw-medium",
  "semi-bold":   "--fw-semi-bold",
  "bold":        "--fw-bold",
  "extra-bold":  "--fw-extra-bold",
  "black":       "--fw-black",
};

// ─── Store ────────────────────────────────────────────────────────────────────
interface ThemeState {
  theme:      ThemeName;
  fontFamily: FontFamily;
  fontSize:   FontSize;
  fontWeight: FontWeight;

  setTheme:      (theme: ThemeName)   => void;
  setFontFamily: (family: FontFamily) => void;
  setFontSize:   (size: FontSize)     => void;
  setFontWeight: (weight: FontWeight) => void;
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────
const root = () => document.documentElement;

const applyTheme = (theme: ThemeName) =>
  root().setAttribute("data-theme", theme);

/** Resolves a CSS variable from :root and writes its value to a target property. */
const applyCssVar = (targetProp: string, sourceProp: string) => {
  const resolved = getComputedStyle(root()).getPropertyValue(sourceProp).trim();
  root().style.setProperty(targetProp, resolved);
};

// ─── Zustand store ────────────────────────────────────────────────────────────
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme:      "Dark",
      fontFamily: "comic",
      fontSize:   "medium",
      fontWeight: "normal",

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      setFontFamily: (fontFamily) => {
        applyCssVar("--app-font-family", FONT_FAMILY_VAR[fontFamily]);
        set({ fontFamily });
      },

      setFontSize: (fontSize) => {
        applyCssVar("--app-font-size", FONT_SIZE_VAR[fontSize]);
        set({ fontSize });
      },

      setFontWeight: (fontWeight) => {
        applyCssVar("--app-font-weight", FONT_WEIGHT_VAR[fontWeight]);
        set({ fontWeight });
      },
    }),
    {
      name: "leitnix-theme",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyTheme(state.theme);
        applyCssVar("--app-font-family", FONT_FAMILY_VAR[state.fontFamily]);
        applyCssVar("--app-font-size",   FONT_SIZE_VAR[state.fontSize]);
        applyCssVar("--app-font-weight", FONT_WEIGHT_VAR[state.fontWeight]);
      },
    },
  ),
);