import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, shadows, spacing, useTheme } from "@/src/design";

type CardVariant = "surface" | "surfaceAlt";

/** Rounded surface container. `elevated` adds a subtle shadow. */
export function Card({
  children,
  variant = "surfaceAlt",
  elevated = false,
  padded = true,
  style,
}: {
  children: ReactNode;
  variant?: CardVariant;
  elevated?: boolean;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        { backgroundColor: colors[variant] },
        elevated && shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.xl },
  padded: { padding: spacing.xl },
});
