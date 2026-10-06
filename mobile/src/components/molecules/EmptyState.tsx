import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { fadeIn, radius, spacing, useTheme, type ThemeColors } from "@/src/design";
import { Button } from "../atoms/Button";
import { Icon, type IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";

const ICON_SIZE = 40;

/**
 * Centered empty-list state: optional icon, title, supporting text, and an
 * optional CTA. Fades in so it doesn't pop when a list finishes loading empty.
 *
 * `background` wraps icon/title/text/CTA in a tinted, rounded card that sets
 * the whole state apart from the screen — pair it with `iconColor` (defaults
 * to `mutedText`, which reads flat against a tinted card) so the icon still
 * stands out from its own backdrop.
 *
 * `pops` fills the card with `surfaceMuted` and adds a muted primary-color
 * circle behind the content, near the top — used where a flat fill reads like
 * an unfinished placeholder.
 * Takes precedence over `background` when both are set.
 */
export function EmptyState({
  icon,
  iconColor = "mutedText",
  background,
  pops = false,
  title,
  text,
  ctaLabel,
  onPressCta,
}: {
  icon?: IconName;
  iconColor?: keyof ThemeColors;
  background?: keyof ThemeColors;
  pops?: boolean;
  title: string;
  text?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}) {
  const { colors } = useTheme();
  const filled = pops || !!background;
  return (
    <Animated.View entering={fadeIn()} style={styles.container}>
      <View
        style={[
          styles.card,
          filled && [
            styles.cardFilled,
            (background || pops) && {
              backgroundColor: colors[pops ? "surfaceMuted" : background!],
            },
          ],
          pops && styles.cardPops,
        ]}
      >
        {pops ? (
          <View pointerEvents="none" style={[styles.pop, { backgroundColor: colors.backdrop }]} />
        ) : null}
        {icon ? (
          <View style={styles.icon}>
            <Icon name={icon} size={ICON_SIZE} color={iconColor} />
          </View>
        ) : null}
        <Text variant="heading" style={styles.title}>
          {title}
        </Text>
        {!!text && (
          <Text variant="body" color="mutedText" style={styles.text}>
            {text}
          </Text>
        )}
        {!!ctaLabel && !!onPressCta && <Button label={ctaLabel} onPress={onPressCta} />}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    // eslint-disable-next-line no-restricted-syntax -- optical centering: nudges the block above true center, not a ladder step
    paddingBottom: 40,
  },
  card: { alignItems: "center", width: "100%" },
  cardFilled: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.card,
  },
  cardPops: { overflow: "hidden" },
  // Two-thirds of the card width, centered on the icon (card padding + half the 40px icon).
  pop: {
    position: "absolute",
    bottom: spacing.xl + ICON_SIZE / 2,
    transform: [{ translateY: "50%" }],
    alignSelf: "center",
    width: "130%",
    aspectRatio: 1,
    borderRadius: radius.pill,
    opacity: 0.18,
  },
  icon: { marginBottom: spacing.sm, opacity: 0.7 },
  title: { marginBottom: spacing["2xs"], textAlign: "center" },
  text: { textAlign: "center", marginBottom: spacing.md },
});
