import { useEffect, useState } from "react";
import { AccessibilityInfo, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { easings, radius, useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";

/** Web animates bar widths over 1s; `durations.slow` (320ms) is far too quick here. */
const WIDTH_DURATION = 1000;
const RAINBOW_SWEEP_DURATION = 2000;
const RAINBOW_FADE_DURATION = 500;
/** Web's `.bar-progress--complete.is-complete` opacity. */
const RAINBOW_OPACITY = 0.3;
const BAR_HEIGHT = 16;

type Props = {
  /** The headline measure — new verses. 0–100. */
  primaryPercentage?: number;
  /** The softer measure behind it — total verses read. 0–100. */
  secondaryPercentage?: number;
  trackColor?: keyof ThemeColors;
  fillColor?: keyof ThemeColors;
  style?: StyleProp<ViewStyle>;
};

const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

/** Web's gradient stops, in order (see `DoubleProgressBar.vue`). */
const RAINBOW_STOPS = [
  ["0%", "red"],
  ["15%", "yellow"],
  ["20%", "yellow"],
  ["30%", "lime"],
  ["40%", "cyan"],
  ["50%", "cyan"],
  ["65%", "blue"],
  ["80%", "magenta"],
  ["100%", "red"],
] as const;

/**
 * Two overlaid progress fills in one track — the mobile counterpart of web's
 * `DoubleProgressBar.vue`.
 *
 * The point of the pair is that the daily goal is measured in *new* verses,
 * but re-reading still counts for something: the primary fill is the number
 * that moves the goal, the dimmer secondary fill behind it is everything read
 * today. At 100% an animated rainbow washes over the bar.
 */
export function DoubleProgressBar({
  primaryPercentage = 0,
  secondaryPercentage = 0,
  trackColor = "progressTrack",
  fillColor = "linkBright",
  style,
}: Props) {
  const { colors } = useTheme();
  const primary = clampPercent(primaryPercentage);
  const secondary = clampPercent(secondaryPercentage);
  const isComplete = primary >= 100;

  const primarySv = useSharedValue(primary);
  const secondarySv = useSharedValue(secondary);
  const rainbowOpacity = useSharedValue(0);
  const rainbowOffset = useSharedValue(0);

  const [reduceMotion, setReduceMotion] = useState(false);
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
    primarySv.value = withTiming(primary, {
      duration: WIDTH_DURATION,
      easing: easings.decelerate,
    });
  }, [primary, primarySv]);

  useEffect(() => {
    secondarySv.value = withTiming(secondary, {
      duration: WIDTH_DURATION,
      easing: easings.decelerate,
    });
  }, [secondary, secondarySv]);

  useEffect(() => {
    rainbowOpacity.value = withTiming(isComplete ? RAINBOW_OPACITY : 0, {
      duration: RAINBOW_FADE_DURATION,
    });
  }, [isComplete, rainbowOpacity]);

  useEffect(() => {
    if (!isComplete || reduceMotion) {
      rainbowOffset.value = 0;
      return;
    }
    // The gradient rect is drawn at 2x width; sliding it one half-width and
    // looping reproduces web's `background-size: 200%` + `move-gradient`.
    rainbowOffset.value = 0;
    rainbowOffset.value = withRepeat(
      withTiming(1, { duration: RAINBOW_SWEEP_DURATION, easing: Easing.linear }),
      -1,
      false
    );
  }, [isComplete, reduceMotion, rainbowOffset]);

  const primaryStyle = useAnimatedStyle(() => ({ width: `${primarySv.value}%` }));
  const secondaryStyle = useAnimatedStyle(() => ({ width: `${secondarySv.value}%` }));
  const rainbowStyle = useAnimatedStyle(() => ({
    opacity: rainbowOpacity.value,
    transform: [{ translateX: `${-50 * rainbowOffset.value}%` }],
  }));

  return (
    <View
      testID="double-progress-bar"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(primary) }}
      style={[
        styles.track,
        // Radius rides with the themed background: on Android a
        // background-only update drops a separately-registered radius.
        { height: BAR_HEIGHT, borderRadius: radius.lg, backgroundColor: colors[trackColor] },
        style,
      ]}
    >
      <Animated.View
        testID="secondary-bar"
        style={[
          styles.bar,
          styles.secondary,
          { backgroundColor: colors[fillColor] },
          secondaryStyle,
        ]}
      />
      <Animated.View
        testID="primary-bar"
        style={[styles.bar, { backgroundColor: colors[fillColor] }, primaryStyle]}
      />
      {isComplete ? (
        <Animated.View testID="primary-bar-complete" style={[styles.rainbow, rainbowStyle]}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="mbl-complete" x1="0" y1="0" x2="1" y2="0">
                {RAINBOW_STOPS.map(([offset, color]) => (
                  <Stop key={`${offset}-${color}`} offset={offset} stopColor={color} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mbl-complete)" />
          </Svg>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: "hidden", position: "relative" },
  bar: { position: "absolute", top: 0, left: 0, height: "100%" },
  secondary: { opacity: 0.7 },
  // Drawn at 2x so the sweep can translate a full half-width and still cover.
  rainbow: { position: "absolute", top: 0, left: 0, height: "100%", width: "200%" },
});
