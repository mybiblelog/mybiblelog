import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";

/**
 * Activity indicator keyed to a semantic color. Pass `center` to fill and
 * center within its parent (used for full-screen loading branches).
 */
export function Spinner({
  size = "small",
  color = "primary",
  center = false,
  style,
}: {
  size?: "small" | "large";
  color?: keyof ThemeColors;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const indicator = <ActivityIndicator size={size} color={colors[color]} />;
  if (center) return <View style={[styles.center, style]}>{indicator}</View>;
  return style ? <View style={style}>{indicator}</View> : indicator;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
