import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing, TOUCH_TARGET, useScalePress, useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";
import { AnimatedPressable } from "./AnimatedPressable";
import { Icon, type IconName } from "./Icon";
import { Spinner } from "./Spinner";
import { Text } from "./Text";

export type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";
export type ButtonSize = "sm" | "md";

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: IconName;
  /**
   * Trailing glyph. Web marks button-styled links that navigate elsewhere with
   * a trailing caret (`CaretRightIcon`); pass `chevron-forward` for parity.
   */
  rightIcon?: IconName;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Primary interactive control. Press feedback (scale + dim), loading spinner,
 * and disabled dimming are built in; minimum height meets the touch target.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  accessibilityLabel,
  testID,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isInteractive = !disabled && !loading;
  const press = useScalePress({ disabled: !isInteractive });

  // Mirrors web's `.mbl-button` family: every variant keeps the 1px border box
  // (accent fills just make it transparent) so the neutral `secondary` fill
  // stays visible against a same-colored surface — in dark mode `surfaceMuted`
  // and `surfaceElevated` are the same value, so without the border a secondary
  // button inside a card disappears.
  const palette: Record<ButtonVariant, { bg: string; border: string; fg: keyof ThemeColors }> = {
    primary: { bg: colors.primary, border: "transparent", fg: "onPrimary" },
    secondary: { bg: colors.surfaceMuted, border: colors.border, fg: "text" },
    destructive: { bg: colors.destructive, border: "transparent", fg: "onDestructive" },
    ghost: { bg: "transparent", border: "transparent", fg: "primary" },
  };
  // A disabled button drops its accent color for a neutral, muted look so it
  // reads as inactive — not just a dimmed version of the live control. Loading
  // keeps the variant color (the spinner still signals an active action).
  const showDisabled = disabled && !loading;
  const isGhost = variant === "ghost";
  const { bg, border, fg } = showDisabled
    ? {
        bg: isGhost ? "transparent" : colors.surfaceMuted,
        border: isGhost ? "transparent" : colors.border,
        fg: "mutedText" as const,
      }
    : palette[variant];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      testID={testID}
      onPress={isInteractive ? onPress : undefined}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={!isInteractive}
      hitSlop={8}
      style={[
        styles.base,
        size === "sm" ? styles.sizeSm : styles.sizeMd,
        // Radius rides along with the colors: Android drops a registered
        // style's borderRadius when only the background changes on re-render.
        { backgroundColor: bg, borderColor: border, borderRadius: radius.button },
        fullWidth && styles.fullWidth,
        press.animatedStyle,
        showDisabled && isGhost && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <Spinner color={fg} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? <Icon name={leftIcon} size={18} color={fg} /> : null}
          <Text variant="button" color={fg}>
            {label}
          </Text>
          {/* Subordinate to the leading icon, matching web's thin caret. */}
          {rightIcon ? <Icon name={rightIcon} size={16} color={fg} /> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.button,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  sizeMd: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sizeSm: {
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.4 },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
});
