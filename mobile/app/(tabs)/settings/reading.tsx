import { useMemo, useState } from "react";
import { useIsAuthenticated } from "@/src/stores/auth";
import { InputField, Screen, SelectRow, SelectSheet, Spinner, Text } from "@/src/components";
import { spacing, useTheme } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { userSettingsActions, useSettingsValue } from "@/src/stores/userSettings";
import { useToast } from "@/src/toast/ToastProvider";
import { BibleApps, BibleVersions } from "@mybiblelog/shared";
import { ScrollView, StyleSheet } from "react-native";

export default function ReadingSettings() {
  const t = useT();
  const { colors } = useTheme();
  const isAuthenticated = useIsAuthenticated();
  const settings = useSettingsValue();
  const { setLocalSettings, updateServerSettings } = userSettingsActions;
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

  if (settings === null) {
    return (
      <Screen edges={[]}>
        <Spinner center />
      </Screen>
    );
  }

  const canUseServer = isAuthenticated;
  // Captured after the null guard so the save closures see a non-null type.
  const current = settings;
  const bibleVersionLabel =
    bibleVersionOptions.find((o) => o.value === settings.preferredBibleVersion)?.label ??
    settings.preferredBibleVersion;
  const bibleAppLabel =
    bibleAppOptions.find((o) => o.value === settings.preferredBibleApp)?.label ??
    settings.preferredBibleApp;

  async function saveDailyGoal() {
    const value = current.dailyVerseCountGoal;
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
    const value = current.lookBackDate;
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
        style={[styles.flex, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        <Text variant="label" color="mutedText" style={styles.sectionLabel}>
          {t("settings_reading_daily_goal_title")}
        </Text>
        <InputField
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
        />

        <Text variant="label" color="mutedText" style={styles.sectionLabel}>
          {t("settings_reading_look_back_date_title")}
        </Text>
        <InputField
          value={settings.lookBackDate}
          onChangeText={(text) => void setLocalSettings({ lookBackDate: text })}
          onEndEditing={() => void saveLookBackDate()}
          returnKeyType="done"
          placeholder="YYYY-MM-DD"
        />

        <Text variant="label" color="mutedText" style={styles.sectionLabel}>
          {t("settings_reading_preferred_bible_version_title")}
        </Text>
        <SelectRow
          value={bibleVersionLabel}
          placeholder={t("settings_select_option")}
          onPress={() => setBibleVersionOpen(true)}
        />

        <Text variant="label" color="mutedText" style={styles.sectionLabel}>
          {t("settings_reading_preferred_bible_app_title")}
        </Text>
        <SelectRow
          value={bibleAppLabel}
          placeholder={t("settings_select_option")}
          onPress={() => setBibleAppOpen(true)}
        />

        {!isAuthenticated && (
          <Text variant="caption" color="mutedText" style={styles.help}>
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
  flex: { flex: 1 },
  content: { padding: spacing.screenH, paddingBottom: spacing.listBottom },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  help: { marginTop: spacing.lg },
});
