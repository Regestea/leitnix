import type { ThemeName } from "../../../stores/themeStore";

/**
 * Mermaid "base" themes recolored from the app's design tokens so diagrams
 * match the active theme instead of mermaid's defaults (which are dark, and
 * were unreadable against the Light background). The svg background stays
 * transparent so the card surface shows through.
 */
export const MERMAID_DARK_THEME = {
  theme: "base",
  themeVariables: {
    background: "transparent",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    primaryColor: "#1e293b",
    primaryTextColor: "#f8fafc",
    primaryBorderColor: "#c2d1e6",
    secondaryColor: "#0f172a",
    secondaryTextColor: "#dbeafe",
    tertiaryColor: "#334155",
    lineColor: "#c2d1e6",
    textColor: "#f8fafc",
    edgeLabelBackground: "#1e293b",
    clusterBkg: "rgba(51, 65, 85, 0.6)",
    clusterBorder: "#94a3b8",
    noteBkgColor: "rgba(51, 65, 85, 0.8)",
    noteBorderColor: "#94a3b8",
    titleColor: "#f8fafc",
  },
} as const;

export const MERMAID_LIGHT_THEME = {
  theme: "base",
  themeVariables: {
    background: "transparent",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    primaryColor: "#f8fafc",
    primaryTextColor: "#1e293b",
    primaryBorderColor: "#1c3e6b",
    secondaryColor: "#e2e8f0",
    secondaryTextColor: "#1e293b",
    tertiaryColor: "#cbd5e1",
    lineColor: "#475569",
    textColor: "#1e293b",
    edgeLabelBackground: "#f8fafc",
    clusterBkg: "rgba(226, 232, 240, 0.6)",
    clusterBorder: "#64748b",
    noteBkgColor: "rgba(226, 232, 240, 0.85)",
    noteBorderColor: "#64748b",
    titleColor: "#1e293b",
  },
} as const;

/** The theme config for the app's resolved theme. */
export function mermaidConfig(theme: ThemeName): Record<string, unknown> {
  return theme === "Dark" ? MERMAID_DARK_THEME : MERMAID_LIGHT_THEME;
}