import {
  useThemeStore,
  type ThemeName,
  type FontFamily,
  type FontSize,
  type FontWeight,
} from "../../shared/store/themeStore";
import { Select } from "../../shared/components/controls/Select";

const THEME_OPTIONS = [
  { value: "Dark", label: "Dark" },
  { value: "Light", label: "Light" },
] satisfies { value: ThemeName; label: string }[];

const FONT_FAMILY_OPTIONS = [
  {
    group: "Custom",
    options: [
      { value: "comic", label: "Comic (default)" },
      { value: "angelina", label: "Angelina" },
    ],
  },
  {
    group: "Generic",
    options: [
      { value: "sans", label: "Sans-serif" },
      { value: "serif", label: "Serif" },
      { value: "mono", label: "Monospace" },
    ],
  },
  {
    group: "Web Fonts",
    options: [
      { value: "inter", label: "Inter" },
      { value: "poppins", label: "Poppins" },
      { value: "vazirmatn", label: "Vazirmatn (Persian)" },
      { value: "roboto", label: "Roboto" },
      { value: "nunito", label: "Nunito" },
      { value: "playfair", label: "Playfair Display" },
      { value: "merriweather", label: "Merriweather" },
      { value: "source-code", label: "Source Code Pro" },
      { value: "jetbrains", label: "JetBrains Mono" },
    ],
  },
] satisfies {
  group: string;
  options: { value: FontFamily; label: string }[];
}[];

const FONT_SIZE_OPTIONS = [
  { value: "xx-small", label: "XX-Small (8px)" },
  { value: "x-small", label: "X-Small (10px)" },
  { value: "small", label: "Small (12px)" },
  { value: "medium", label: "Medium (16px) — default" },
  { value: "large", label: "Large (18px)" },
  { value: "x-large", label: "X-Large (24px)" },
  { value: "xx-large", label: "XX-Large (32px)" },
  { value: "xxx-large", label: "XXX-Large (48px)" },
] satisfies { value: FontSize; label: string }[];

const FONT_WEIGHT_OPTIONS = [
  { value: "thin", label: "Thin (100)" },
  { value: "extra-light", label: "Extra Light (200)" },
  { value: "light", label: "Light (300)" },
  { value: "normal", label: "Normal (400) — default" },
  { value: "medium", label: "Medium (500)" },
  { value: "semi-bold", label: "Semi Bold (600)" },
  { value: "bold", label: "Bold (700)" },
  { value: "extra-bold", label: "Extra Bold (800)" },
  { value: "black", label: "Black (900)" },
] satisfies { value: FontWeight; label: string }[];

export default function ThemeForm() {
  const {
    theme,
    setTheme,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    fontWeight,
    setFontWeight,
  } = useThemeStore();

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ overflow: "auto" }}>
        <Select
          label="Theme"
          value={theme}
          items={THEME_OPTIONS}
          onChange={setTheme}
        />
        <Select
          label="Font Family"
          value={fontFamily}
          items={FONT_FAMILY_OPTIONS}
          onChange={setFontFamily}
        />
        <Select
          label="Font Size"
          value={fontSize}
          items={FONT_SIZE_OPTIONS}
          onChange={setFontSize}
        />
        <Select
          label="Font Weight"
          value={fontWeight}
          items={FONT_WEIGHT_OPTIONS}
          onChange={setFontWeight}
        />
      </div>
    </div>
  );
}
