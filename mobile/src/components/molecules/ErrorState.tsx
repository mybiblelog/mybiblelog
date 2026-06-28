import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { fadeIn, spacing } from "@/src/design";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";

/** Centered error state with an icon and an optional retry action. */
export function ErrorState({
  title,
  text,
  retryLabel,
  onRetry,
}: {
  title: string;
  text?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <Animated.View entering={fadeIn()} style={styles.container}>
      <View style={styles.icon}>
        <Icon name="alert-circle-outline" size={40} color="destructive" />
      </View>
      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      {!!text && (
        <Text variant="body" color="mutedText" style={styles.text}>
          {text}
        </Text>
      )}
      {!!retryLabel && !!onRetry && (
        <Button label={retryLabel} variant="secondary" onPress={onRetry} />
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
  icon: { marginBottom: spacing.lg },
  title: { marginBottom: spacing.xs, textAlign: "center" },
  text: { textAlign: "center", marginBottom: spacing.xl },
});
