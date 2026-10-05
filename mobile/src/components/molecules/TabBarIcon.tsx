import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { durations, easings, radius, useTheme } from "@/src/design";

/** Container height; also the pill's height/width when unselected (a square). */
const PILL_HEIGHT = 28;
/** Pill width once selected -- wide enough to read as a rounded rectangle. */
const PILL_WIDTH_SELECTED = 56;

type Props = {
  focused: boolean;
  children: React.ReactNode;
};

/**
 * Background behind a bottom-tab icon. Unselected, it's an invisible square
 * (width === height); selected, it fades in to a fully opaque pill wider
 * than it is tall (`borderRadius: radius.pill` always clamps to a stadium
 * shape, so the same style works for both the square and rectangular
 * profiles). Reanimated drives opacity and width together so the shape
 * morphs smoothly on selection change instead of popping between states.
 */
export function TabBarIcon({ focused, children }: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, {
      duration: durations.base,
      easing: easings.standard,
    });
  }, [focused, progress]);

  const pillStyle = useAnimatedStyle(() => {
    const width = PILL_HEIGHT + (PILL_WIDTH_SELECTED - PILL_HEIGHT) * progress.value;
    return {
      opacity: progress.value,
      width,
      left: (PILL_WIDTH_SELECTED - width) / 2,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        style={[styles.pill, { backgroundColor: colors.surfaceMuted }, pillStyle]}
      />
      <View style={styles.iconWrap}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: PILL_WIDTH_SELECTED,
    height: PILL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    position: "absolute",
    top: 0,
    height: PILL_HEIGHT,
    borderRadius: radius.pill,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
