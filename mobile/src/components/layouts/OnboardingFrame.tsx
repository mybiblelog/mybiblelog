import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { radius, spacing, useTheme } from "@/src/design";

/**
 * Wraps the pre-app flow (login/register/forgot-password and the onboarding
 * wizard) in a solid-color bezel with heavily rounded corners, so the flow
 * reads as its own distinct moment rather than a plain screen in the tabbed
 * app behind it. `surfaceMuted` is used for the bezel (rather than `surface`,
 * which is identical to `background` in light mode) so the frame is visible
 * in both schemes.
 */
export function OnboardingFrame({ children }: { children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.frame, { backgroundColor: colors.surfaceMuted }]}>
      <View style={[styles.inner, { backgroundColor: colors.background }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    padding: spacing.sm,
  },
  inner: {
    flex: 1,
    borderRadius: radius["3xl"],
    overflow: "hidden",
  },
});
