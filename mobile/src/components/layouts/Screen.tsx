import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing, useTheme } from "@/src/design";

type Edge = "top" | "bottom";

/**
 * Standard screen container: paints the themed background and applies
 * safe-area insets so content never collides with the status bar / notch
 * or the home indicator.
 *
 * - Headerless tab screens (Today, Calendar, Checklist, Log) should keep the
 *   default `edges={["top"]}` — they have no native header to protect them.
 * - Screens pushed under a native stack header already get a top inset from
 *   the header, so pass `edges={[]}`.
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

  const paddingTop =
    (edges.includes("top") ? insets.top : 0) + (padded ? spacing.screenTop : 0);
  const paddingBottom = edges.includes("bottom") ? insets.bottom : 0;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: colors.background, paddingTop, paddingBottom },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.screenH,
  },
});
