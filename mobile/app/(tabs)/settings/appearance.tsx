import { useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AppearanceSettings() {
  const t = useT();
  const { mode, setMode, colors } = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
        {t("settings_theme_label")}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
        <Pressable
          style={[
            styles.row,
            mode === "system" && styles.rowSelected,
            mode === "system" && { backgroundColor: colors.border },
          ]}
          onPress={() => setMode("system")}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>{t("theme_system")}</Text>
          <Text style={[styles.check, { color: colors.text }]}>{mode === "system" ? "✓" : ""}</Text>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Pressable
          style={[
            styles.row,
            mode === "light" && styles.rowSelected,
            mode === "light" && { backgroundColor: colors.border },
          ]}
          onPress={() => setMode("light")}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>{t("theme_light")}</Text>
          <Text style={[styles.check, { color: colors.text }]}>{mode === "light" ? "✓" : ""}</Text>
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Pressable
          style={[
            styles.row,
            mode === "dark" && styles.rowSelected,
            mode === "dark" && { backgroundColor: colors.border },
          ]}
          onPress={() => setMode("dark")}
        >
          <Text style={[styles.rowText, { color: colors.text }]}>{t("theme_dark")}</Text>
          <Text style={[styles.check, { color: colors.text }]}>{mode === "dark" ? "✓" : ""}</Text>
        </Pressable>
      </View>

      <Text style={[styles.help, { color: colors.mutedText }]}>{t("settings_theme_help")}</Text>
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

