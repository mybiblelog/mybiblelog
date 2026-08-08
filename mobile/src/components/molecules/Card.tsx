import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing, useScalePress, useTheme } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";

/**
 * Padding presets, mirroring web's card classes:
 *   "content"   — `.mbl-card__content`   (24)
 *   "list-item" — `.mbl-card--list-item` (8 / 16), for rows in a list
 *   "none"      — bare `.mbl-card`, for cards that group their own children
 */
export type CardPadding = "content" | "list-item" | "none";

/** Callout tones, mirroring web's `.mbl-message--info` / `--success`. */
export type CardTone = "neutral" | "info" | "success";

type Props = {
  children: ReactNode;
  padding?: CardPadding;
  /**
   * Drop the resting shadow. For cards nested inside another surface, where a
   * second elevation reads as a rendering artifact rather than depth.
   */
  flat?: boolean;
  tone?: CardTone;
  onPress?: () => void;
  /** Override the press animation — wide targets want less travel. */
  pressFeedback?: { scaleTo?: number; opacityTo?: number };
  accessibilityLabel?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Rounded elevated surface — the mobile counterpart of web's `.mbl-card`.
 *
 * Like web, a card is always an opaque elevated surface with a resting shadow;
 * there is no "flat variant" to opt into by default. In light mode
 * `surfaceElevated` equals `background`, so the shadow's 1px rim layer is doing
 * the work a border would — which is why `flat` is the exception, not the rule.
 */
export function Card({
  children,
  padding = "content",
  flat = false,
  tone = "neutral",
  onPress,
  pressFeedback,
  accessibilityLabel,
  testID,
  style,
}: Props) {
  const { colors, shadows } = useTheme();
  const press = useScalePress({ disabled: !onPress, ...pressFeedback });

  const toneStyle =
    tone === "info"
      ? { backgroundColor: colors.messageInfoBg, borderColor: colors.messageInfoBorder }
      : tone === "success"
        ? { backgroundColor: colors.messageSuccessBg, borderColor: colors.messageSuccessBorder }
        : { backgroundColor: colors.surfaceElevated };

  const base: StyleProp<ViewStyle> = [
    styles.card,
    padding === "content" && styles.paddingContent,
    padding === "list-item" && styles.paddingListItem,
    // Radius rides along with the themed background on purpose: on Android a
    // background-only style update drops a separately-registered borderRadius.
    { borderRadius: radius.card, ...toneStyle },
    tone !== "neutral" && styles.toned,
    !flat && shadows.card,
    style,
  ];

  if (!onPress) {
    return (
      <View testID={testID} style={base}>
        {children}
      </View>
    );
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[base, press.animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { maxWidth: "100%", position: "relative" },
  paddingContent: { padding: spacing.xl },
  paddingListItem: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  // Toned callouts carry a visible edge, as web's .mbl-message does.
  toned: { borderWidth: StyleSheet.hairlineWidth },
});
