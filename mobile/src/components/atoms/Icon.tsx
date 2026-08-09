import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "@/src/design";
import type { ThemeColors } from "@/src/design";

export type IconName = keyof typeof Ionicons.glyphMap;

/**
 * Vector glyphs drawn locally instead of pulled from the Ionicons font. Web
 * draws its add/create affordances with a hand-tuned plus
 * (`web/app/components/svg/PlusIcon.vue`) rather than a font glyph; the same
 * path is stroked here so both clients render the same mark. Entries are keyed
 * by the Ionicons name they stand in for, so call sites don't change.
 */
const LOCAL_GLYPHS: Partial<Record<IconName, string>> = {
  add: "M12 5V19M5 12H19",
};

const LOCAL_GLYPH_VIEWBOX = "0 0 24 24";
const LOCAL_GLYPH_STROKE_WIDTH = 2.5;

/** Icon wrapper keyed to semantic theme colors (local SVG, else Ionicons). */
export function Icon({
  name,
  size = 20,
  color = "text",
}: {
  name: IconName;
  size?: number;
  color?: keyof ThemeColors;
}) {
  const { colors } = useTheme();
  const localGlyph = LOCAL_GLYPHS[name];

  if (localGlyph) {
    return (
      <Svg width={size} height={size} viewBox={LOCAL_GLYPH_VIEWBOX} fill="none">
        <Path
          d={localGlyph}
          stroke={colors[color]}
          strokeWidth={LOCAL_GLYPH_STROKE_WIDTH}
          strokeLinecap="round"
        />
      </Svg>
    );
  }

  return <Ionicons name={name} size={size} color={colors[color]} />;
}
