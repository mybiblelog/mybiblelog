import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/auth/AuthProvider";
import { SelectSheet } from "@/src/components/SelectSheet";
import { TOUCH_TARGET } from "@/src/theme/tokens";
import { useT } from "@/src/i18n/LocaleProvider";
import { useUserSettings } from "@/src/settings/UserSettingsProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useToast } from "@/src/toast/ToastProvider";
import { BibleApps, BibleVersions } from "@mybiblelog/shared";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ReadingSettings() {
  const t = useT();
  const { colors } = useTheme();
  const { state: authState } = useAuth();
  const { state: settingsState, setLocalSettings, updateServerSettings } = useUserSettings();
  const { showToast } = useToast();

  const [bibleVersionOpen, setBibleVersionOpen] = useState(false);
  const [bibleAppOpen, setBibleAppOpen] = useState(false);

  const bibleVersionOptions = useMemo(() => {
    const names: Record<string, string> = {
      [BibleVersions.NASB2020]: "New American Standard Bible (NASB)",
      [BibleVersions.NASB1995]: "New American Standard Bible 1995 (NASB 1995)",
      [BibleVersions.AMP]: "Amplified Bible (AMP)",
      [BibleVersions.KJV]: "King James Version (KJV)",
      [BibleVersions.NKJV]: "New King James Version (NKJV)",
      [BibleVersions.NIV]: "New International Version (NIV)",
      [BibleVersions.ESV]: "English Standard Version (ESV)",
      [BibleVersions.NABRE]: "New American Bible Revised Edition (NABRE)",
      [BibleVersions.NLT]: "New Living Translation (NLT)",
      [BibleVersions.TPT]: "The Passion Translation (TPT)",
      [BibleVersions.MSG]: "The Message (MSG)",
      [BibleVersions.RVR1960]: "Reina-Valera 1960 (RVR1960)",
      [BibleVersions.RVR2020]: "Reina-Valera 2020 (RVR2020)",
      [BibleVersions.UKR]: "українська (UKRK)",
      [BibleVersions.BDS]: "Bible du Semeur (BDS)",
      [BibleVersions.LSG]: "Louis Segond (LSG)",
      [BibleVersions.ARC]: "Almeida Revista e Corrigida (ARC)",
      [BibleVersions.LUT]: "Luther 1545 (LUT)",
    };

    return Object.keys(names).map((value) => ({ value, label: names[value] }));
  }, []);

  const bibleAppOptions = useMemo(() => {
    const names: Record<string, string> = {
      [BibleApps.BIBLEGATEWAY]: "Bible Gateway",
      [BibleApps.YOUVERSIONAPP]: "YouVersion App",
      [BibleApps.BIBLECOM]: "Bible.com (YouVersion)",
      [BibleApps.BLUELETTERBIBLE]: "Blue Letter Bible",
      [BibleApps.OLIVETREE]: "Olive Tree App",
    };
    return Object.keys(names).map((value) => ({ value, label: names[value] }));
  }, []);

  if (settingsState.status !== "ready") {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const settings = settingsState.settings;
  const canUseServer = authState.status === "authenticated";
  const bibleVersionLabel =
    bibleVersionOptions.find((o) => o.value === settings.preferredBibleVersion)?.label ??
    settings.preferredBibleVersion;
  const bibleAppLabel =
    bibleAppOptions.find((o) => o.value === settings.preferredBibleApp)?.label ??
    settings.preferredBibleApp;

  async function saveDailyGoal() {
    const value = settings.dailyVerseCountGoal;
    if (!Number.isFinite(value) || value < 1 || value > 1111) {
      showToast({ type: "error", message: t("settings_save_invalid") });
      return;
    }
    if (canUseServer) {
      const ok = await updateServerSettings({ dailyVerseCountGoal: value });
      if (ok) {
        showToast({ type: "success", message: t("settings_saved_successfully") });
        return;
      }
    }
    await setLocalSettings({ dailyVerseCountGoal: value });
    showToast({ type: "success", message: t("settings_saved_successfully") });
  }

  async function saveLookBackDate() {
    const value = settings.lookBackDate;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      showToast({ type: "error", message: t("settings_save_invalid") });
      return;
    }
    if (canUseServer) {
      const ok = await updateServerSettings({ lookBackDate: value });
      if (ok) {
        showToast({ type: "success", message: t("settings_saved_successfully") });
        return;
      }
    }
    await setLocalSettings({ lookBackDate: value });
    showToast({ type: "success", message: t("settings_saved_successfully") });
  }

  // Selecting an option applies it immediately — no separate Save step.
  async function selectPreferredBibleVersion(value: string) {
    if (!value) {
      showToast({ type: "error", message: t("settings_save_invalid") });
      return;
    }
    await setLocalSettings({ preferredBibleVersion: value });
    if (canUseServer) {
      await updateServerSettings({ preferredBibleVersion: value });
    }
    showToast({ type: "success", message: t("settings_saved_successfully") });
  }

  async function selectPreferredBibleApp(value: string) {
    // Device-only (API does not currently store this).
    await setLocalSettings({ preferredBibleApp: value });
    showToast({ type: "success", message: t("settings_saved_successfully") });
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
      >
        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
          {t("settings_reading_daily_goal_title")}
        </Text>
        <View style={[styles.rowCard, { backgroundColor: colors.surfaceAlt }]}>
          <TextInput
            value={String(settings.dailyVerseCountGoal ?? "")}
            onChangeText={(text) => {
              const n = Number(text);
              if (!Number.isFinite(n)) {
                void setLocalSettings({ dailyVerseCountGoal: 0 });
                return;
              }
              void setLocalSettings({ dailyVerseCountGoal: Math.floor(n) });
            }}
            onEndEditing={() => void saveDailyGoal()}
            returnKeyType="done"
            keyboardType="number-pad"
            placeholder="86"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
          {t("settings_reading_look_back_date_title")}
        </Text>
        <View style={[styles.rowCard, { backgroundColor: colors.surfaceAlt }]}>
          <TextInput
            value={settings.lookBackDate}
            onChangeText={(text) => void setLocalSettings({ lookBackDate: text })}
            onEndEditing={() => void saveLookBackDate()}
            returnKeyType="done"
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.placeholder}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
          {t("settings_reading_preferred_bible_version_title")}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
          <Pressable
            style={styles.selectRow}
            onPress={() => setBibleVersionOpen(true)}
          >
            <Text style={[styles.selectText, { color: colors.text }]} numberOfLines={1}>
              {bibleVersionLabel || t("settings_select_option")}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.mutedText} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedText }]}>
          {t("settings_reading_preferred_bible_app_title")}
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surfaceAlt }]}>
          <Pressable
            style={styles.selectRow}
            onPress={() => setBibleAppOpen(true)}
          >
            <Text style={[styles.selectText, { color: colors.text }]} numberOfLines={1}>
              {bibleAppLabel || t("settings_select_option")}
            </Text>
            <Ionicons name="chevron-down" size={18} color={colors.mutedText} />
          </Pressable>
        </View>

        {authState.status !== "authenticated" && (
          <Text style={[styles.help, { color: colors.mutedText }]}>
            {t("settings_reading_local_only_notice")}
          </Text>
        )}
      </ScrollView>

      <SelectSheet
        visible={bibleVersionOpen}
        title={t("settings_reading_preferred_bible_version_title")}
        options={bibleVersionOptions}
        selectedValue={settings.preferredBibleVersion || null}
        onSelect={(v) => void selectPreferredBibleVersion(String(v))}
        onClose={() => setBibleVersionOpen(false)}
      />

      <SelectSheet
        visible={bibleAppOpen}
        title={t("settings_reading_preferred_bible_app_title")}
        options={bibleAppOptions}
        selectedValue={settings.preferredBibleApp || null}
        onSelect={(v) => void selectPreferredBibleApp(String(v))}
        onClose={() => setBibleAppOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    padding: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: "700",
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: TOUCH_TARGET,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
  },
  help: {
    marginTop: 14,
    fontSize: 13,
  },
});

