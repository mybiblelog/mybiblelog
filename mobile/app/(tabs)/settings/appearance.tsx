import { Fragment } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { spacing, useTheme, type ThemeMode } from "@/src/design";
import { Card, Icon, ListItem, Screen, ScreenHeader, Text } from "@/src/components";
import { useT } from "@/src/i18n/LocaleProvider";

export default function AppearanceSettings() {
  const t = useT();
  const { mode, setMode, colors } = useTheme();

  const options: { value: ThemeMode; label: string }[] = [
    { value: "system", label: t("theme_system") },
    { value: "light", label: t("theme_light") },
    { value: "dark", label: t("theme_dark") },
  ];

  return (
    <Screen>
      <ScreenHeader padded back title={t("settings_section_appearance")} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="label" color="mutedText" style={styles.sectionLabel}>
          {t("settings_theme_label")}
        </Text>

        <Card padding="none">
          {options.map((opt, i) => (
            <Fragment key={opt.value}>
              {i > 0 ? <View style={[styles.divider, { backgroundColor: colors.border }]} /> : null}
              <ListItem
                title={opt.label}
                variant="plain"
                onPress={() => setMode(opt.value)}
                trailing={
                  mode === opt.value ? (
                    <Icon name="checkmark" size={20} color="primary" />
                  ) : undefined
                }
              />
            </Fragment>
          ))}
        </Card>

        <Text variant="caption" color="mutedText" style={styles.help}>
          {t("settings_theme_help")}
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
