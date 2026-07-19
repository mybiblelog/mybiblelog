import { useEffect } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Circle, Svg } from "react-native-svg";
import { easings, useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";

const SPIN_MS = 800;
const SIZES = { small: 20, large: 36 } as const;
// Fraction of the ring left visible, the rest is a gap — the "broken circle" look.
const ARC_FRACTION = 0.75;

/**
 * Continuously rotating "broken circle" busy indicator, keyed to a semantic
 * color. Driven by Reanimated (not the platform's native ActivityIndicator)
 * so it renders identically on iOS/Android. Pass `center` to fill and center
 * within its parent (used for full-screen loading branches).
 */
export function Spinner({
  size = "small",
  color = "primary",
  center = false,
  style,
}: {
  size?: "small" | "large";
  color?: keyof ThemeColors;
  center?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const dimension = SIZES[size];
  const strokeWidth = size === "large" ? 3 : 2;
  const radius = (dimension - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const rotation = useSharedValue(0);
  useEffect(() => {
    // A busy indicator communicates ongoing activity, not decoration — it
    // must keep spinning even when the OS "reduce motion" setting is on.
    rotation.value = withRepeat(
      withTiming(360, { duration: SPIN_MS, easing: easings.linear }),
      -1,
      false,
      undefined,
      ReduceMotion.Never
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const spinner = (
    <Animated.View
      accessibilityRole="progressbar"
      style={[{ width: dimension, height: dimension }, animatedStyle]}
    >
      <Svg width={dimension} height={dimension}>
        <Circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          stroke={colors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference * ARC_FRACTION} ${circumference}`}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );

  if (center) return <View style={[styles.center, style]}>{spinner}</View>;
  return style ? <View style={style}>{spinner}</View> : spinner;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
