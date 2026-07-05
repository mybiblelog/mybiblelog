import { StyleSheet, View } from "react-native";
import { radius, spacing, useTheme } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Text } from "../atoms/Text";

export type SegmentedControlOption<T extends string | number> = {
  value: T;
  label: string;
};

type Props<T extends string | number> = {
  label?: string;
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/**
 * Inline segmented control for small mutually-exclusive option sets (the
 * mobile stand-in for the web query manager's radio groups).
 */
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {!!label && (
        <Text variant="label" color="mutedText">
          {label}
        </Text>
      )}
      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <AnimatedPressable
              key={String(option.value)}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.segment, selected && { backgroundColor: colors.primary }]}
            >
              <Text variant="label" color={selected ? "onPrimary" : "mutedText"} numberOfLines={1}>
                {option.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  track: {
    flexDirection: "row",
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 34,
  },
});
