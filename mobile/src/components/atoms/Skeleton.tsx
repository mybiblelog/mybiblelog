import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";
import type { DimensionValue, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { easings, radius as radiusTokens, useTheme } from "@/src/design";

// Pulse cycle for the shimmer. Intentionally slower than interaction motion so
// it reads as ambient "loading" rather than a transition. Matches web's
// `skeleton-loader-pulse` (1.4s, opacity 1 -> 0.45).
const PULSE_MS = 1400;
const PULSE_MIN_OPACITY = 0.45;

/** Pulsing placeholder block for loading states. */
export function Skeleton({
  width = "100%",
  height = 16,
  radius = radiusTokens.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const progress = useSharedValue(1);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Web disables the pulse under `prefers-reduced-motion`; match that.
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withRepeat(
      withTiming(PULSE_MIN_OPACITY, { duration: PULSE_MS, easing: easings.standard }),
      -1,
      true
    );
  }, [progress, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.skeleton },
        animatedStyle,
        style,
      ]}
    />
  );
}
