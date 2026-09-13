import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { useTheme } from "@/src/design";

const DOT_SPACING = 17;
const DOT_RADIUS = 1.4;
const DOT_OPACITY = 0.22;
const HEIGHT_RATIO = 0.55;

/**
 * Decorative dot grid pinned to the top of a screen, fading into the themed
 * background via an overlaid gradient. Purely visual — never intercepts touch.
 */
export function BackgroundPattern() {
  const { colors, scheme } = useTheme();
  const { width } = useWindowDimensions();
  const height = Math.round(width * HEIGHT_RATIO);
  const dotColor = scheme === "dark" ? colors.primary : colors.secondary;

  return (
    <View pointerEvents="none" style={[styles.root, { height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id="mbl-bg-pattern"
            width={DOT_SPACING}
            height={DOT_SPACING}
            patternUnits="userSpaceOnUse"
          >
            <Circle
              cx={DOT_SPACING / 2}
              cy={DOT_SPACING / 2}
              r={DOT_RADIUS}
              fill={dotColor}
              fillOpacity={DOT_OPACITY}
            />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#mbl-bg-pattern)" />
      </Svg>
      <LinearGradient colors={["transparent", colors.background]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
});
