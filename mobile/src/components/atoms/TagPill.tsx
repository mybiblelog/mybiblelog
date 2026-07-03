import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing, useTheme } from "@/src/design";
import { hexToRgb } from "@/src/notes/tagSort";
import { AnimatedPressable } from "./AnimatedPressable";
import { Text } from "./Text";

export type TagPillProps = {
  label: string;
  /** Tag hex color (pill background). */
  color: string;
  size?: "sm" | "md";
  /** Dim unselected pills when used as a toggle. */
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** WCAG relative luminance, enough to pick black vs white text on the tag color. */
function isDarkColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return true;
  const channel = (v: number) => {
    const n = v / 255;
    return n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
  return luminance < 0.45;
}

/** Colored tag chip (mobile equivalent of the web `PassageNoteTagPill`). */
export function TagPill({ label, color, size = "md", selected, onPress, style }: TagPillProps) {
  const { colors } = useTheme();
  const textColor = isDarkColor(color) ? "#ffffff" : "#000000";
  const dimmed = selected === false;

  const pill = (
    <View
      style={[
        styles.pill,
        size === "sm" ? styles.pillSm : styles.pillMd,
        { backgroundColor: color, borderColor: colors.border },
        dimmed && styles.dimmed,
        style,
      ]}
    >
      <Text
        variant={size === "sm" ? "caption" : "label"}
        style={{ color: textColor }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) return pill;
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      hitSlop={4}
    >
      {pill}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignSelf: "flex-start",
  },
  pillMd: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pillSm: { paddingHorizontal: spacing.sm, paddingVertical: 2 },
  dimmed: { opacity: 0.45 },
});
