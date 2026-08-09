import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, spacing, useScalePress } from "@/src/design";
import type { ThemeColors } from "@/src/design";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { Icon, type IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";
import { Card } from "./Card";

export type ListItemProps = {
  /** Small label above the title — context for what the row is, not part of it. */
  overline?: string;
  /** Plain string (styled as `bodyStrong`) or a custom node (e.g. a colored pill). */
  title: ReactNode;
  /** Semantic color for the title (ignored when `title` is a node). */
  titleColor?: keyof ThemeColors;
  subtitle?: string;
  meta?: string;
  leading?: ReactNode;
  leadingIcon?: IconName;
  trailing?: ReactNode;
  /** Show a forward chevron in the trailing slot (ignored if `trailing` set). */
  chevron?: boolean;
  onPress?: () => void;
  /**
   * "card" — a standalone row with card chrome, matching web where every list
   * row is `.mbl-card.mbl-card--list-item`.
   * "plain" — no surface of its own, for rows grouped inside a parent Card.
   */
  variant?: "card" | "plain";
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Generic row: optional leading icon/node, title + subtitle + meta, trailing
 * node or chevron. Tappable rows get scale press feedback automatically.
 *
 * Web has no ListItem — it composes rows straight out of `.mbl-card`. This
 * keeps the layout contract as a named component but defers all chrome
 * (surface, radius, elevation, padding) to `Card`, so the two platforms can't
 * drift apart on what a list row looks like.
 */
export function ListItem({
  overline,
  title,
  titleColor = "text",
  subtitle,
  meta,
  leading,
  leadingIcon,
  trailing,
  chevron,
  onPress,
  variant = "card",
  testID,
  style,
}: ListItemProps) {
  const press = useScalePress({ disabled: !onPress, ...ROW_PRESS });

  const inner = (
    <>
      {leading ?? (leadingIcon ? <Icon name={leadingIcon} size={20} color="mutedText" /> : null)}
      <View style={styles.body}>
        {!!overline && (
          <Text variant="caption" color="mutedText" style={styles.overline}>
            {overline}
          </Text>
        )}
        {typeof title === "string" ? (
          <Text variant="bodyStrong" color={titleColor}>
            {title}
          </Text>
        ) : (
          title
        )}
        {!!subtitle && (
          <Text variant="subtitle" color="mutedText" style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
        {!!meta && (
          <Text variant="caption" color="mutedText" style={styles.meta}>
            {meta}
          </Text>
        )}
      </View>
      {trailing ?? (chevron ? <Icon name="chevron-forward" size={18} color="mutedText" /> : null)}
    </>
  );

  if (variant === "card") {
    // Card owns the chrome and the press feedback; a row only lays out.
    return (
      <Card
        padding="list-item"
        onPress={onPress}
        testID={testID}
        pressFeedback={ROW_PRESS}
        style={style}
      >
        <View style={styles.row}>{inner}</View>
      </Card>
    );
  }

  const base: StyleProp<ViewStyle> = [styles.row, styles.plain, style];

  if (!onPress)
    return (
      <View testID={testID} style={base}>
        {inner}
      </View>
    );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[base, press.animatedStyle]}
    >
      {inner}
    </AnimatedPressable>
  );
}

/** Rows are wide, so they want less travel under the finger than a card does. */
const ROW_PRESS = { scaleTo: 0.98, opacityTo: 0.95 };

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  // A Card row gets its padding from "list-item"; a plain row brings its own.
  // The radius is invisible on a transparent row but keeps callers that tint
  // themselves (selection highlights, the danger row) reading as rounded.
  plain: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.xl,
  },
  body: { flex: 1 },
  overline: { marginBottom: spacing["3xs"] },
  subtitle: { marginTop: spacing["3xs"] },
  meta: { marginTop: spacing["2xs"] },
});
