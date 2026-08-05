import { StyleSheet, Text, View, useColorScheme } from "react-native";
import { colorsByScheme, radius, spacing, typography } from "@/src/design";

type Props = {
  /** Env var names that are required but absent (`MISSING_CONFIG`). */
  missing: readonly string[];
};

/**
 * Last-resort screen for a build whose required env vars are missing.
 *
 * Intentionally standalone: raw React Native + color tokens, no `Text`/`Card`
 * atoms, no ThemeProvider/LocaleProvider, no i18n. This renders precisely when
 * the app's configuration is broken, so it must not depend on the provider tree
 * it is replacing. Copy is hardcoded English because it is developer-facing —
 * a correctly built release can never reach it, since `MISSING_CONFIG` is empty
 * whenever the build-time gate (`scripts/check-build-env.mjs`) has passed.
 */
export function ConfigErrorScreen({ missing }: Props) {
  const colors = colorsByScheme[useColorScheme() === "dark" ? "dark" : "light"];

  return (
    <View
      testID="config-error.screen"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Configuration error</Text>

      <Text style={[styles.body, { color: colors.mutedText }]}>
        This build is missing required configuration, so the app can’t start.
      </Text>

      <View
        style={[styles.list, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
      >
        {missing.map((name) => (
          <Text
            key={name}
            testID={`config-error.missing.${name}`}
            style={[styles.var, { color: colors.destructive }]}
          >
            {name}
          </Text>
        ))}
      </View>

      <Text style={[styles.body, { color: colors.mutedText }]}>
        Set them in the EAS environment for this build profile, or in mobile/.env for a local build,
        then rebuild. Verify first with: npm run check:build-env -- --profile PROFILE
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.pageGutter,
    gap: spacing.md,
  },
  title: typography.title,
  body: typography.body,
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  var: typography.bodyStrong,
});
