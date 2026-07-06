import { StyleSheet, View } from "react-native";
import { useTheme } from "@/src/design";

/**
 * Small dot flagging an attention-needed state (e.g. "sign in required").
 * Absolutely positioned — render inside a `position: relative` wrapper
 * around the icon/element it should badge.
 */
export function AttentionDot({ size = 9 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View
      testID="attentionDot"
      pointerEvents="none"
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.destructive,
          borderColor: colors.surface,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {
    position: "absolute",
    top: -2,
    right: -2,
    borderWidth: 1.5,
  },
});
