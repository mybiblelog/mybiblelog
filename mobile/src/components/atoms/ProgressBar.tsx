import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { durations, easings, radius, useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";

/** Track + animated fill. `progress` is 0–1; the fill width eases on change. */
export function ProgressBar({
  progress,
  height = 10,
  color = "primary",
  trackColor = "border",
  style,
}: {
  progress: number;
  height?: number;
  color?: keyof ThemeColors;
  trackColor?: keyof ThemeColors;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const clamped = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const widthSv = useSharedValue(clamped);

  useEffect(() => {
    widthSv.value = withTiming(clamped, {
      duration: durations.base,
      easing: easings.standard,
    });
  }, [clamped, widthSv]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${widthSv.value * 100}%` }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: radius.pill, backgroundColor: colors[trackColor] },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { borderRadius: radius.pill, backgroundColor: colors[color] },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden" },
  fill: { height: "100%" },
});
