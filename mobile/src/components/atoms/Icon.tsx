import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";

export type IconName = keyof typeof Ionicons.glyphMap;

/** Ionicons wrapper keyed to semantic theme colors. */
export function Icon({
  name,
  size = 20,
  color = "text",
}: {
  name: IconName;
  size?: number;
  color?: keyof ThemeColors;
}) {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={colors[color]} />;
}
