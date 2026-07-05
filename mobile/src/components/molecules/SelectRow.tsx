import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing, TOUCH_TARGET, useScalePress, useTheme } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

/**
 * Labeled tap-to-open selector: shows the current value (or a placeholder) and
 * a chevron. Opens a picker (e.g. SelectSheet) via `onPress`.
 */
export function SelectRow({
  label,
  value,
  placeholder,
  onPress,
  disabled = false,
  testID,
  style,
}: {
  label?: string;
  value?: string | number | null;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const press = useScalePress({ disabled, scaleTo: 0.98 });
  const hasValue = value !== null && value !== undefined && value !== "" && value !== 0;

  return (
    <View style={[styles.container, style]}>
      {!!label && (
        <Text variant="label" color="mutedText">
          {label}
        </Text>
      )}
      <AnimatedPressable
        accessibilityRole="button"
        accessibilityLabel={label ?? placeholder}
        testID={testID}
        onPress={disabled ? undefined : onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        disabled={disabled}
        style={[
          styles.select,
          { borderColor: colors.border },
          disabled && styles.disabled,
          press.animatedStyle,
        ]}
      >
        <Text variant="bodyStrong" color={hasValue ? "text" : "mutedText"}>
          {hasValue ? String(value) : placeholder}
        </Text>
        <Icon name="chevron-down" size={16} color="mutedText" />
      </AnimatedPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
  },
  disabled: { opacity: 0.5 },
});
