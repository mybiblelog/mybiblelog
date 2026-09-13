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

/**
 * Inline segmented control for small mutually-exclusive option sets (the
 * mobile stand-in for the web query manager's radio groups). The selection
 * indicator is a single absolutely-positioned pill that slides between
 * segments, mirroring web's `TestamentToggle` thumb.
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

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: indicatorX.value }],
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
        style={[styles.track, { backgroundColor: colors.surfaceMuted }]}
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
              <Text variant="label" color={selected ? "onPrimary" : "mutedText"} numberOfLines={1}>
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
    borderRadius: radius.pill,
    padding: TRACK_PADDING,
    gap: SEGMENT_GAP,
  },
  indicator: {
    position: "absolute",
    top: TRACK_PADDING,
    bottom: TRACK_PADDING,
    left: TRACK_PADDING,
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
