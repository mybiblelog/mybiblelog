import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing, useScalePress, useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Icon, type IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";

export type ListItemProps = {
  /** Plain string (styled as `bodyStrong`) or a custom node (e.g. a colored pill). */
  title: ReactNode;
  /** Semantic color for the title (ignored when `title` is a node). */
  titleColor?: keyof ThemeColors;
  subtitle?: string;
  meta?: string;
  leading?: ReactNode;
  leadingIcon?: IconName;
  trailing?: ReactNode;
  /** Show a forward chevron in the trailing slot (ignored if `trailing` set). */
  chevron?: boolean;
  onPress?: () => void;
  bordered?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Generic row: optional leading icon/node, title + subtitle + meta, trailing
 * node or chevron. Tappable rows get scale press feedback automatically.
 */
export function ListItem({
  title,
  titleColor = "text",
  subtitle,
  meta,
  leading,
  leadingIcon,
  trailing,
  chevron,
  onPress,
  bordered = true,
  testID,
  style,
}: ListItemProps) {
  const { colors } = useTheme();
  const press = useScalePress({ disabled: !onPress, scaleTo: 0.98, opacityTo: 0.95 });

  const inner = (
    <>
      {leading ?? (leadingIcon ? <Icon name={leadingIcon} size={20} color="mutedText" /> : null)}
      <View style={styles.body}>
        {typeof title === "string" ? (
          <Text variant="bodyStrong" color={titleColor}>
            {title}
          </Text>
        ) : (
          title
        )}
        {!!subtitle && (
          <Text variant="subtitle" color="mutedText" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
        {!!meta && (
          <Text variant="caption" color="mutedText" style={styles.meta}>
            {meta}
          </Text>
        )}
      </View>
      {trailing ?? (chevron ? <Icon name="chevron-forward" size={18} color="mutedText" /> : null)}
    </>
  );

  const base: StyleProp<ViewStyle> = [
    styles.row,
    { backgroundColor: colors.surface },
    bordered && {
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
    },
    style,
  ];

  if (!onPress)
    return (
      <View testID={testID} style={base}>
        {inner}
      </View>
    );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[base, press.animatedStyle]}
    >
      {inner}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  body: { flex: 1 },
  subtitle: { marginTop: 2 },
  meta: { marginTop: 4 },
});
