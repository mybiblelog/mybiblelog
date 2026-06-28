import type { ViewStyle } from "react-native";

/**
 * Elevation presets. Each combines iOS shadow properties with an Android
 * `elevation`. Spread onto a surface: `style={[styles.card, shadows.md]}`.
 *
 * Shadow color is intentionally pure black at low opacity so it reads on both
 * light and dark surfaces without needing a themed value.
 */
export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  } as ViewStyle,
  sm: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  } as ViewStyle,
  lg: {
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  } as ViewStyle,
} as const;
