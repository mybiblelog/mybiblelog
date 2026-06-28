import { StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { TOUCH_TARGET, useScalePress } from "@/src/design";
import type { ThemeColors } from "@/src/design";
import { AnimatedPressable } from "./AnimatedPressable";
import { Icon, type IconName } from "./Icon";

export type IconButtonProps = {
  name: IconName;
  onPress?: () => void;
  size?: number;
  color?: keyof ThemeColors;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
};

/** Square, touch-target-sized icon control with scale press feedback. */
export function IconButton({
  name,
  onPress,
  size = 20,
  color = "mutedText",
  disabled = false,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const press = useScalePress({ disabled, scaleTo: 0.9 });
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      onPress={disabled ? undefined : onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      hitSlop={8}
      style={[styles.button, press.animatedStyle, disabled && styles.disabled, style]}
    >
      <Icon name={name} size={size} color={color} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    borderRadius: TOUCH_TARGET / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.4 },
});
