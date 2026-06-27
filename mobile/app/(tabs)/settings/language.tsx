import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function LanguageSettings() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  const { colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
        {t("settings_language_label")}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
        <Pressable
          style={[
            styles.row,
            locale === "en" && styles.rowSelected,
            locale === "en" && { backgroundColor: colors.border },
          ]}
          onPress={() => setLocale("en")}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>{t("language_english")}</Text>
          <Text style={[styles.check, { color: colors.text }]}>{locale === "en" ? "✓" : ""}</Text>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Pressable
          style={[
            styles.row,
            locale === "es" && styles.rowSelected,
            locale === "es" && { backgroundColor: colors.border },
          ]}
          onPress={() => setLocale("es")}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>{t("language_spanish")}</Text>
          <Text style={[styles.check, { color: colors.text }]}>{locale === "es" ? "✓" : ""}</Text>
        </Pressable>
      </View>

      <Text style={[styles.help, { color: colors.mutedText }]}>{t("settings_language_help")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 14,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  rowSelected: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  rowText: {
    fontSize: 16,
    fontWeight: "700",
  },
  check: {
    width: 24,
    textAlign: "right",
    fontSize: 18,
    fontWeight: "900",
    opacity: 0.9,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  help: {
    marginTop: 10,
    fontSize: 13,
  },
});

