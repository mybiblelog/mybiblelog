import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, useTheme } from "@/src/design";
import { OfflineBanner } from "../molecules/OfflineBanner";

type Edge = "top" | "bottom";

/**
 * Standard screen container: paints the themed background and applies
 * safe-area insets so content never collides with the status bar / notch
 * or the home indicator.
 *
 * - Every screen owns its heading in content via `ScreenHeader` and hides the
 *   native stack header, so the default `edges={["top"]}` is right everywhere —
 *   there's no header bar left to supply the top inset.
 * - The bottom tab bar owns the bottom inset, so `bottom` is opt-in.
 *
 * `padded` adds the default horizontal gutter + top content gap on top of the
 * safe-area inset (use for simple flex screens; omit for full-bleed lists that
 * manage their own padding).
 */
export function Screen({
  children,
  edges = ["top"],
  padded = false,
  style,
}: {
  children: ReactNode;
  edges?: Edge[];
  padded?: boolean;
  style?: ViewStyle;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const paddingTop = edges.includes("top") ? insets.top : 0;
  const paddingBottom = edges.includes("bottom") ? insets.bottom : 0;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop, paddingBottom },
        style,
      ]}
    >
      {/* Full-bleed: never inset by `padded`, so it always spans the screen width. */}
      <OfflineBanner />
      <View style={[styles.body, padded && styles.padded]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.pageGutter,
    paddingTop: spacing.pageTop,
  },
});
