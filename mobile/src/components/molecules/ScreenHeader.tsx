import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { spacing, TOUCH_TARGET } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { IconButton, Text } from "../atoms";

export type ScreenHeaderProps = {
  /** The screen's one top-level heading. */
  title: string;
  /** Optional orienting line under the title (e.g. Today's date). */
  subtitle?: string;
  /** Renders the leading back chevron. */
  back?: boolean;
  /** Overrides the chevron's default `router.back()`. */
  onBack?: () => void;
  /** Trailing actions — buttons, a spinner, month nav. */
  right?: ReactNode;
  /**
   * Adds the page gutter + top gap. Pass this when the header is *not* already
   * inside a `<Screen padded>` — e.g. above a screen's own ScrollView, or as a
   * list's `ListHeaderComponent`.
   */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * The single definition of a screen's top-level heading.
 *
 * Every screen renders its title in content through this component — including
 * screens pushed onto a stack, which hide the native header and take the back
 * chevron here instead. That keeps one heading size (`typography.title`) app-wide
 * rather than mixing it with React Navigation's much smaller native title.
 */
export function ScreenHeader({
  title,
  subtitle,
  back = false,
  onBack,
  right,
  padded = false,
  style,
}: ScreenHeaderProps) {
  const t = useT();

  return (
    <View style={[styles.row, padded && styles.padded, style]}>
      {back ? (
        <IconButton
          name="chevron-back"
          color="text"
          accessibilityLabel={t("back")}
          testID="screen-header.back"
          onPress={onBack ?? (() => router.back())}
          // The 44pt touch box is wider than the glyph, so pull it left to keep
          // the chevron optically on the page gutter.
          style={styles.back}
        />
      ) : null}

      <View style={styles.titleWrap}>
        <Text variant="title" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="subtitle" color="mutedText" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    // Reserve the full touch-target height even when `right`/`back` is
    // absent or shorter than that (e.g. a Spinner), so the row doesn't
    // shrink to the title's line height on screens without a tall control —
    // that shrink is what causes a layout jump when navigating to/from a
    // screen that does have one (e.g. Books' Progress button vs Checklist).
    minHeight: TOUCH_TARGET,
  },
  padded: {
    paddingHorizontal: spacing.pageGutter,
    paddingTop: spacing.pageTop,
  },
  back: {
    marginLeft: -spacing.sm,
    marginRight: -spacing.xs,
  },
  titleWrap: { flex: 1 },
  subtitle: { marginTop: spacing["3xs"] },
});
