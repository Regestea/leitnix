import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import { SettingRepository } from "../../repositories/SettingRepository";

export type ThemeName = "Light" | "Dark";

export type FontFamily =
  | "comic"
  | "angelina"
  | "sans"
  | "serif"
  | "mono"
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
  comic: "--font-comic",
  angelina: "--font-angelina",
  sans: "--font-sans",
  serif: "--font-serif",
  mono: "--font-mono",
  inter: "--font-inter",
  poppins: "--font-poppins",
  vazirmatn: "--font-vazirmatn",
  roboto: "--font-roboto",
  nunito: "--font-nunito",
  playfair: "--font-playfair",
  merriweather: "--font-merriweather",
  "source-code": "--font-source-code",
  jetbrains: "--font-jetbrains",
};

export type FontSize =
  | "xx-small"
  | "x-small"
  | "small"
  | "medium"
  | "large"
  | "x-large"
  | "xx-large"
  | "xxx-large";

const FONT_SIZE_VAR: Record<FontSize, string> = {
  "xx-small": "--fs-xx-small",
  "x-small": "--fs-x-small",
  small: "--fs-small",
  medium: "--fs-medium",
  large: "--fs-large",
  "x-large": "--fs-x-large",
  "xx-large": "--fs-xx-large",
  "xxx-large": "--fs-xxx-large",
};

export type FontWeight =
  | "thin"
  | "extra-light"
  | "light"
  | "normal"
  | "medium"
  | "semi-bold"
  | "bold"
  | "extra-bold"
  | "black";

const FONT_WEIGHT_VAR: Record<FontWeight, string> = {
  thin: "--fw-thin",
  "extra-light": "--fw-extra-light",
  light: "--fw-light",
  normal: "--fw-normal",
  medium: "--fw-medium",
  "semi-bold": "--fw-semi-bold",
  bold: "--fw-bold",
  "extra-bold": "--fw-extra-bold",
  black: "--fw-black",
};

interface ThemeState {
  theme: ThemeName;
  fontFamily: FontFamily;
  fontSize: FontSize;
  fontWeight: FontWeight;

  setTheme: (theme: ThemeName) => void;
  setFontFamily: (family: FontFamily) => void;
  setFontSize: (size: FontSize) => void;
  setFontWeight: (weight: FontWeight) => void;
  initialize: () => void;
}

const root = () => document.documentElement;

const applyTheme = (theme: ThemeName) =>
  root().setAttribute("data-theme", theme);

const applyCssVar = (targetProp: string, sourceProp: string) => {
  const resolved = getComputedStyle(root()).getPropertyValue(sourceProp).trim();
  root().style.setProperty(targetProp, resolved);
};

const sqliteStorage: StateStorage = {
  getItem: async (name) => {
    void name;

    const row = await SettingRepository.getOrCreateDefaults();

    const state = {
      theme: row.Theme as ThemeName,
      fontFamily: row.FontFamily as FontFamily,
      fontSize: row.FontSize as FontSize,
      fontWeight: row.FontWeight as FontWeight,
    };
    return JSON.stringify({ state, version: 0 });
  },

  setItem: async (name, value) => {
    void name;

    const { state } = JSON.parse(value);
    await SettingRepository.upsert({
      FontFamily: state.fontFamily,
      FontSize: state.fontSize,
      FontWeight: state.fontWeight,
      Theme: state.theme,
    });
  },

  removeItem: async (name) => {
    void name;
  },
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "Dark",
      fontFamily: "comic",
      fontSize: "medium",
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

      initialize: () => {
        const { theme, fontFamily, fontSize, fontWeight } = get();
        applyTheme(theme);
        applyCssVar("--app-font-family", FONT_FAMILY_VAR[fontFamily]);
        applyCssVar("--app-font-size", FONT_SIZE_VAR[fontSize]);
        applyCssVar("--app-font-weight", FONT_WEIGHT_VAR[fontWeight]);
      },
    }),
    {
      name: "leitnix-theme",
      storage: createJSONStorage(() => sqliteStorage),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.initialize();
      },
    },
  ),
);
