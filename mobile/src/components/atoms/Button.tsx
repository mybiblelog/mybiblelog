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
  fullWidth = false,
  accessibilityLabel,
  testID,
  style,
}: ButtonProps) {
  const { colors } = useTheme();
  const isInteractive = !disabled && !loading;
  const press = useScalePress({ disabled: !isInteractive });

  const palette: Record<ButtonVariant, { bg: string; fg: keyof ThemeColors }> = {
    primary: { bg: colors.primary, fg: "onPrimary" },
    secondary: { bg: colors.surfaceAlt, fg: "text" },
    destructive: { bg: colors.destructive, fg: "onDestructive" },
    ghost: { bg: "transparent", fg: "primary" },
  };
  const { bg, fg } = palette[variant];

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
        { backgroundColor: bg },
        fullWidth && styles.fullWidth,
        press.animatedStyle,
        disabled && styles.disabled,
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
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  sizeMd: {
    minHeight: TOUCH_TARGET,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  sizeSm: {
    minHeight: 36,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  fullWidth: { alignSelf: "stretch" },
  disabled: { opacity: 0.4 },
  content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
