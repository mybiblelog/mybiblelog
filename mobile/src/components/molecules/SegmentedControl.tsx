import { useEffect, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { durations, easings, radius, spacing, useTheme } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Text } from "../atoms/Text";

export type SegmentedControlOption<T extends string | number> = {
  value: T;
  label: string;
  testID?: string;
};

type Props<T extends string | number> = {
  label?: string;
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Inset of the track's inner edge from its own border (matches web's thumb inset). */
const TRACK_PADDING = 3;
const SEGMENT_GAP = 3;
/** Height of the sliding underline bar beneath the active tab's label. */
const UNDERLINE_HEIGHT = 3;
/** Horizontal inset of the underline from its segment's edges, so it reads as a short bar under the label rather than spanning the full segment width. */
const UNDERLINE_INSET = 10;

/**
 * Inline segmented control for small mutually-exclusive option sets (the
 * mobile stand-in for the web query manager's radio groups). Styled like a
 * classic tab bar: a subtle, low-contrast track with a short rounded
 * underline bar that slides beneath the active tab's label, rather than a
 * solid pill filling the whole segment.
 */
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: Props<T>) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value)
  );
  const count = options.length;

  const segmentWidth = count
    ? (trackWidth - TRACK_PADDING * 2 - SEGMENT_GAP * (count - 1)) / count
    : 0;

  const indicatorX = useSharedValue(0);

  useEffect(() => {
    if (!segmentWidth) return;
    indicatorX.value = withTiming(selectedIndex * (segmentWidth + SEGMENT_GAP), {
      duration: durations.base,
      easing: easings.standard,
    });
  }, [indicatorX, segmentWidth, selectedIndex]);

  const underlineWidth = Math.max(segmentWidth - UNDERLINE_INSET * 2, 0);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: underlineWidth,
    transform: [{ translateX: indicatorX.value + UNDERLINE_INSET }],
  }));

  const handleTrackLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container}>
      {!!label && (
        <Text variant="label" color="mutedText">
          {label}
        </Text>
      )}
      <View
        style={[styles.track, { backgroundColor: colors.surfaceSubtleTranslucent }]}
        onLayout={handleTrackLayout}
      >
        {!!segmentWidth && (
          <Animated.View
            style={[styles.indicator, { backgroundColor: colors.primary }, indicatorStyle]}
          />
        )}
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <AnimatedPressable
              key={String(option.value)}
              testID={option.testID}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={styles.segment}
            >
              <Text variant="label" color={selected ? "primary" : "mutedText"} numberOfLines={1}>
                {option.label}
              </Text>
            </AnimatedPressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing["2xs"] },
  track: {
    position: "relative",
    flexDirection: "row",
    borderRadius: radius.lg,
    padding: TRACK_PADDING,
    gap: SEGMENT_GAP,
  },
  indicator: {
    position: "absolute",
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
    height: UNDERLINE_HEIGHT,
    borderRadius: radius.pill,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    minHeight: 34,
  },
});
