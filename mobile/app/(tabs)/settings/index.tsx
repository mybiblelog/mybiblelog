import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { radius, spacing, useTheme } from "@/src/design";
import { AttentionDot, Icon, type IconName, ListItem } from "@/src/components";
import { useT } from "@/src/i18n/LocaleProvider";
import { useIsUnauthenticated } from "@/src/stores/auth";

function SectionRow({
  icon,
  title,
  subtitle,
  onPress,
  alert = false,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  alert?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <ListItem
      title={title}
      subtitle={subtitle}
      chevron
      onPress={onPress}
      bordered={false}
      style={{ backgroundColor: colors.surfaceAlt }}
      leading={
        <View style={[styles.badge, { backgroundColor: colors.border }]}>
          <Icon name={icon} size={18} color="text" />
          {alert && <AttentionDot />}
        </View>
      }
    />
  );
}

export default function SettingsIndex() {
  const t = useT();
  const { colors } = useTheme();
  const showSignInAlert = useIsUnauthenticated();
  return (
    <ScrollView
      style={[styles.flex, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <SectionRow
        icon="person-circle-outline"
        title={t("settings_section_account")}
        subtitle={t("settings_section_account_subtitle")}
        onPress={() => router.push("/settings/account")}
        alert={showSignInAlert}
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
      <SectionRow
        icon="information-circle-outline"
        title={t("settings_section_about")}
        subtitle={t("settings_section_about_subtitle")}
        onPress={() => router.push("/settings/about")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: spacing.screenH,
    gap: spacing.md,
    paddingBottom: spacing.listBottom,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
