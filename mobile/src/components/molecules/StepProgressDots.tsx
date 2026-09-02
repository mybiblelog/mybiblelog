import { StyleSheet, View } from "react-native";
import { radius, spacing, useTheme } from "@/src/design";

/**
 * Row of pill/dot indicators for a linear multi-step flow (e.g. the
 * onboarding wizard). `currentStep` is 0-indexed; the active dot widens and
 * fills with the primary color, mirroring web's `PillProgressBar`.
 */
export function StepProgressDots({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === currentStep ? colors.primary : colors.border,
              borderRadius: radius.pill,
            },
            i === currentStep && styles.dotActive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing["2xs"], alignItems: "center" },
  dot: { width: 8, height: 8 },
  dotActive: { width: 20 },
});
