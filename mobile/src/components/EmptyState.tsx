import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { radius, spacing, TOUCH_TARGET, typography } from "@/src/theme/tokens";

/**
 * Centered empty-list state: title, supporting text, and an optional CTA.
 * Replaces the near-identical empty states that were duplicated across the
 * Today / Log / Calendar screens.
 */
export function EmptyState({
  title,
  text,
  ctaLabel,
  onPressCta,
}: {
  title: string;
  text?: string;
  ctaLabel?: string;
  onPressCta?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {!!text && (
        <Text style={[styles.text, { color: colors.mutedText }]}>{text}</Text>
      )}
      {!!ctaLabel && !!onPressCta && (
        <Pressable
          style={[styles.cta, { backgroundColor: colors.primary }]}
          onPress={onPressCta}
        >
          <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
            {ctaLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  cta: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: TOUCH_TARGET,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    ...typography.buttonLabel,
  },
});
