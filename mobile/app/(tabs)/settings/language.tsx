import { Fragment } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { spacing, useTheme } from "@/src/design";
import { Card, Icon, ListItem, Screen, Text } from "@/src/components";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";

export default function LanguageSettings() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const { colors } = useTheme();

  const options = [
    { value: "en" as const, label: t("language_english") },
    { value: "de" as const, label: t("language_german") },
    { value: "es" as const, label: t("language_spanish") },
    { value: "fr" as const, label: t("language_french") },
    { value: "ko" as const, label: t("language_korean") },
    { value: "pt" as const, label: t("language_portuguese") },
    { value: "uk" as const, label: t("language_ukrainian") },
  ];

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="label" color="mutedText" style={styles.sectionLabel}>
          {t("settings_language_label")}
        </Text>

        <Card padding="none">
          {options.map((opt, i) => (
            <Fragment key={opt.value}>
              {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
              <ListItem
                title={opt.label}
                testID={`language.option-${opt.value}`}
                variant="plain"
                onPress={() => setLocale(opt.value)}
                trailing={
                  locale === opt.value ? (
                    <Icon name="checkmark" size={20} color="primary" />
                  ) : undefined
                }
              />
            </Fragment>
          ))}
        </Card>

        <Text variant="caption" color="mutedText" style={styles.help}>
          {t("settings_language_help")}
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.pageGutter, paddingBottom: spacing.listBottom },
  sectionLabel: { marginTop: spacing.sm, marginBottom: spacing.xs },
  divider: { height: StyleSheet.hairlineWidth },
  help: { marginTop: spacing.sm },
});
