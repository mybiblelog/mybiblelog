import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Svg, { Circle, Defs, Pattern, Rect } from "react-native-svg";
import { useTheme } from "@/src/design";

const DOT_SPACING = 12;
const DOT_RADIUS = 1.4;
// Dark mode sits on a near-black canvas, so the same opacity that reads fine
// against white washes out almost completely — bump it up so the grid stays
// visible without going loud.
const DOT_OPACITY_LIGHT = 0.1;
const DOT_OPACITY_DARK = 0.3;
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
  const dotOpacity = scheme === "dark" ? DOT_OPACITY_DARK : DOT_OPACITY_LIGHT;

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
              fillOpacity={dotOpacity}
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
