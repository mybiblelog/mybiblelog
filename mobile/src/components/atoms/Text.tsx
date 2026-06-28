import { Text as RNText, type StyleProp, type TextProps, type TextStyle } from "react-native";
import { typography, useTheme } from "@/src/design";
import type { ThemeColors, TypographyVariant } from "@/src/design";

export type AppTextProps = TextProps & {
  /** Named type style from the design system. Default `body`. */
  variant?: TypographyVariant;
  /** Semantic theme color key. Default `text`. */
  color?: keyof ThemeColors;
  style?: StyleProp<TextStyle>;
};

/**
 * Themed text. Replaces the repeated `<Text style={[s, { color }]}>` pattern:
 *   <Text variant="title">Today</Text>
 *   <Text variant="subtitle" color="mutedText">{date}</Text>
 */
export function Text({ variant = "body", color = "text", style, ...rest }: AppTextProps) {
  const { colors } = useTheme();
  return <RNText style={[typography[variant], { color: colors[color] }, style]} {...rest} />;
}
