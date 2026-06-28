import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { fadeIn, spacing } from "@/src/design";
import { Button } from "../atoms/Button";
import { Icon, type IconName } from "../atoms/Icon";
import { Text } from "../atoms/Text";

/**
 * Centered empty-list state: optional icon, title, supporting text, and an
 * optional CTA. Fades in so it doesn't pop when a list finishes loading empty.
 */
export function EmptyState({
  icon,
  title,
  text,
  ctaLabel,
  onPressCta,
}: {
  icon?: IconName;
  title: string;
  text?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}) {
  return (
    <Animated.View entering={fadeIn()} style={styles.container}>
      {icon ? (
        <View style={styles.icon}>
          <Icon name={icon} size={40} color="mutedText" />
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
      {!!ctaLabel && !!onPressCta && (
        <Button label={ctaLabel} onPress={onPressCta} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xxxl,
    paddingBottom: 40,
  },
  icon: { marginBottom: spacing.lg, opacity: 0.7 },
  title: { marginBottom: spacing.xs, textAlign: "center" },
  text: { textAlign: "center", marginBottom: spacing.xl },
});
