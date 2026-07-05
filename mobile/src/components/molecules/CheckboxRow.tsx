import type { ReactNode } from "react";
import { StyleSheet } from "react-native";
import { spacing, TOUCH_TARGET, useScalePress } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

type Props = {
  /** Plain text label; pass `children` instead for custom content (e.g. a TagPill). */
  label?: string;
  children?: ReactNode;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

/** Tappable checkbox row for multi-select lists and boolean toggles. */
export function CheckboxRow({ label, children, checked, onToggle, disabled = false }: Props) {
  const press = useScalePress({ disabled, scaleTo: 0.98, opacityTo: 0.9 });
  return (
    <AnimatedPressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      onPress={disabled ? undefined : onToggle}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      style={[styles.row, disabled && styles.disabled, press.animatedStyle]}
    >
      <Icon
        name={checked ? "checkbox" : "square-outline"}
        size={22}
        color={checked ? "primary" : "mutedText"}
      />
      {children ?? (
        <Text variant="body" style={styles.label}>
          {label}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: TOUCH_TARGET,
    paddingVertical: spacing.xs,
  },
  label: { flex: 1 },
  disabled: { opacity: 0.5 },
});
