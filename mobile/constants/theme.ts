import { Platform, useColorScheme } from "react-native";

// ─── Expo default Colors (preserved exactly) ─────────────────
const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

// ─── Expo default Fonts (preserved exactly) ──────────────────
export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// ─── Light Theme ─────────────────────────────────────────────
export const lightTheme = {
  dark: false,
  colors: {
    // Expo defaults
    text: Colors.light.text,
    background: Colors.light.background,
    tint: Colors.light.tint,
    icon: Colors.light.icon,
    tabIconDefault: Colors.light.tabIconDefault,
    tabIconSelected: Colors.light.tabIconSelected,
    // Extended
    primary: Colors.light.tint,
    primaryDark: "#086d8a",
    primaryLight: "#e6f4f8",
    danger: "#FF4D4F",
    dangerLight: "#FFF1F0",
    success: "#52c41a",
    warning: "#fa8c16",
    surface: "#FFFFFF",
    surfaceSecond: "#F8F9FA",
    card: "#FFFFFF",
    textSecondary: "#444C52",
    textMuted: Colors.light.icon,
    textPlaceholder: "#B0B7BC",
    textInverse: "#FFFFFF",
    border: "#E6E8EB",
    divider: "#F0F2F4",
    inputBg: "#F8F9FA",
    inputBorder: "#DDE1E4",
    inputBorderFocus: Colors.light.tint,
    inputBorderError: "#FF4D4F",
    bubbleOwn: Colors.light.tint,
    bubbleOther: "#FFFFFF",
    bubbleOwnText: "#FFFFFF",
    bubbleOtherText: Colors.light.text,
    tabBar: "#FFFFFF",
    tabBarBorder: "#E6E8EB",
    tabActive: Colors.light.tabIconSelected,
    tabInactive: Colors.light.tabIconDefault,
  },
};

// ─── Dark Theme ──────────────────────────────────────────────
export const darkTheme = {
  dark: true,
  colors: {
    // Expo defaults
    text: Colors.dark.text,
    background: Colors.dark.background,
    tint: Colors.dark.tint,
    icon: Colors.dark.icon,
    tabIconDefault: Colors.dark.tabIconDefault,
    tabIconSelected: Colors.dark.tabIconSelected,
    // Extended
    primary: "#3ab4d4",
    primaryDark: "#0a7ea4",
    primaryLight: "#0d2b33",
    danger: "#ff7875",
    dangerLight: "#2a1010",
    success: "#73d13d",
    warning: "#ffc53d",
    surface: "#1E2022",
    surfaceSecond: "#252829",
    card: "#1E2022",
    textSecondary: "#B8BEC2",
    textMuted: Colors.dark.icon,
    textPlaceholder: "#555C61",
    textInverse: "#11181C",
    border: "#2C3033",
    divider: "#252829",
    inputBg: "#252829",
    inputBorder: "#2C3033",
    inputBorderFocus: "#3ab4d4",
    inputBorderError: "#ff7875",
    bubbleOwn: "#0a7ea4",
    bubbleOther: "#1E2022",
    bubbleOwnText: "#FFFFFF",
    bubbleOtherText: Colors.dark.text,
    tabBar: "#151718",
    tabBarBorder: "#2C3033",
    tabActive: Colors.dark.tabIconSelected,
    tabInactive: Colors.dark.tabIconDefault,
  },
};

export type Theme = typeof lightTheme;
export type ThemeColors = typeof lightTheme.colors;

// ─── Typography ───────────────────────────────────────────────
const ff = Fonts?.sans ?? "normal";
export const typography = {
  h1: {
    fontSize: 30,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
    fontFamily: ff,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
    fontFamily: ff,
  },
  h3: { fontSize: 20, fontWeight: "700" as const, fontFamily: ff },
  h4: { fontSize: 17, fontWeight: "700" as const, fontFamily: ff },
  body: {
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
    fontFamily: ff,
  },
  bodyBold: { fontSize: 15, fontWeight: "600" as const, fontFamily: ff },
  caption: { fontSize: 13, fontWeight: "400" as const, fontFamily: ff },
  small: { fontSize: 11, fontWeight: "400" as const, fontFamily: ff },
  label: { fontSize: 13, fontWeight: "600" as const, fontFamily: ff },
  button: { fontSize: 15, fontWeight: "700" as const, fontFamily: ff },
  mono: {
    fontSize: 13,
    fontWeight: "400" as const,
    fontFamily: Fonts?.mono ?? "monospace",
  },
};

// ─── Spacing ──────────────────────────────────────────────────
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

// ─── Radius ───────────────────────────────────────────────────
export const radius = { sm: 8, md: 12, lg: 16, xl: 20, full: 999 };

// ─── Shadows ──────────────────────────────────────────────────
export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ─── useTheme hook ────────────────────────────────────────────
export function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const theme = isDark ? darkTheme : lightTheme;
  return {
    theme,
    colors: theme.colors,
    isDark,
    typography,
    spacing,
    radius,
    shadows,
    fonts: Fonts,
  };
}

export function useColors() {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme.colors : lightTheme.colors;
}
