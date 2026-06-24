import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useT } from "@/src/i18n/LocaleProvider";

function SectionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.sectionRow, { backgroundColor: colors.surfaceAlt }]}
      onPress={onPress}
    >
      <View style={[styles.sectionIcon, { backgroundColor: colors.border }]}>
        <Ionicons name={icon} size={18} color={colors.text} />
      </View>
      <View style={styles.sectionMain}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
        {!!subtitle && (
          <Text style={[styles.sectionSubtitle, { color: colors.mutedText }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.mutedText} />
    </Pressable>
  );
}

export default function SettingsIndex() {
  const t = useT();
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <SectionRow
        icon="person-circle-outline"
        title={t("settings_section_account")}
        subtitle={t("settings_section_account_subtitle")}
        onPress={() => router.push("/settings/account")}
      />

      <SectionRow
        icon="bookmarks-outline"
        title={t("settings_section_reading")}
        subtitle={t("settings_section_reading_subtitle")}
        onPress={() => router.push("/settings/reading")}
      />

      <SectionRow
        icon="color-palette-outline"
        title={t("settings_section_appearance")}
        subtitle={t("settings_section_appearance_subtitle")}
        onPress={() => router.push("/settings/appearance")}
      />

      <SectionRow
        icon="language-outline"
        title={t("settings_section_language")}
        subtitle={t("settings_section_language_subtitle")}
        onPress={() => router.push("/settings/language")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 24,
  },
  sectionRow: {
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionMain: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: "600",
  },
});

