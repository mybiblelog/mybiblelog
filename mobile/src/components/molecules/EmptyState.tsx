import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { fadeIn, radius, spacing, useTheme, type ThemeColors } from "@/src/design";
import { Button } from "../atoms/Button";
import { Icon, type IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";

/**
 * Centered empty-list state: optional icon, title, supporting text, and an
 * optional CTA. Fades in so it doesn't pop when a list finishes loading empty.
 *
 * `background` wraps icon/title/text/CTA in a tinted, rounded card that sets
 * the whole state apart from the screen — pair it with `iconColor` (defaults
 * to `mutedText`, which reads flat against a tinted card) so the icon still
 * stands out from its own backdrop.
 */
export function EmptyState({
  icon,
  iconColor = "mutedText",
  background,
  title,
  text,
  ctaLabel,
  onPressCta,
}: {
  icon?: IconName;
  iconColor?: keyof ThemeColors;
  background?: keyof ThemeColors;
  title: string;
  text?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={fadeIn()} style={styles.container}>
      <View
        style={[
          styles.card,
          background && [styles.cardFilled, { backgroundColor: colors[background] }],
        ]}
      >
        {icon ? (
          <View style={styles.icon}>
            <Icon name={icon} size={40} color={iconColor} />
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
  icon: { marginBottom: spacing.sm, opacity: 0.7 },
  title: { marginBottom: spacing["2xs"], textAlign: "center" },
  text: { textAlign: "center", marginBottom: spacing.md },
});
