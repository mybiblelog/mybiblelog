import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useIsAuthenticated } from "@/src/stores/auth";
import {
  Button,
  InputField,
  Screen,
  SelectRow,
  SelectSheet,
  Spinner,
  Text,
} from "@/src/components";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import type { LocalUserSettings } from "@/src/settings/userSettingsStorage";
import {
  userSettingsActions,
  useSettingsValue,
  useUserSettingsStore,
} from "@/src/stores/userSettings";
import { useToast } from "@/src/toast/ToastProvider";
import { bibleAppNames, BibleVersions } from "@mybiblelog/shared";
import { ScrollView, StyleSheet, View } from "react-native";

/**
 * Reading settings are edited as drafts and only written when the user presses
 * that setting's Save — typing or picking an option changes nothing on the
 * device or the server, so a half-finished edit can't become the saved value.
 */

type SettingField =
  "dailyVerseCountGoal" | "lookBackDate" | "preferredBibleVersion" | "preferredBibleApp";

/** Every editable setting as a string, so drafts compare in one stable form. */
type Drafts = Record<SettingField, string>;

const MIN_DAILY_GOAL = 1;
const MAX_DAILY_GOAL = 1111;

function toDrafts(settings: LocalUserSettings): Drafts {
  return {
    dailyVerseCountGoal: String(settings.dailyVerseCountGoal),
    lookBackDate: settings.lookBackDate,
    preferredBibleVersion: settings.preferredBibleVersion,
    preferredBibleApp: settings.preferredBibleApp,
  };
}

/** A YYYY-MM-DD string that names a real calendar day (rejects e.g. 2026-02-30). */
function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number) as [number, number, number];
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export default function ReadingSettings() {
  const settings = useSettingsValue();

  // The form only mounts once settings exist, so every draft starts out holding
  // the saved value instead of adopting it a render later.
  if (settings === null) {
    return (
      <Screen edges={[]}>
        <Spinner center />
      </Screen>
    );
  }
  return <ReadingSettingsForm settings={settings} />;
}

function ReadingSettingsForm({ settings }: { settings: LocalUserSettings }) {
  const t = useT();
  const isAuthenticated = useIsAuthenticated();
  const { setLocalSettings, updateServerSettings } = userSettingsActions;
  const { showToast } = useToast();

  const [bibleVersionOpen, setBibleVersionOpen] = useState(false);
  const [bibleAppOpen, setBibleAppOpen] = useState(false);
  const [savingField, setSavingField] = useState<SettingField | null>(null);
  const [errors, setErrors] = useState<Partial<Record<SettingField, string>>>({});

  const saved = toDrafts(settings);
  const [drafts, setDrafts] = useState(saved);

  // Settings can also change from outside this screen — a background refresh
  // from the server, or the store reloading after sign-in. Adopt such a change
  // only where the draft still matches what the store held before it, so an
  // edit in progress is never overwritten underneath the user.
  useEffect(
    () =>
      useUserSettingsStore.subscribe((state, prevState) => {
        if (state.state.status !== "ready" || prevState.state.status !== "ready") return;
        const next = toDrafts(state.state.settings);
        const before = toDrafts(prevState.state.settings);
        setDrafts((current) => {
          const merged = { ...current };
          let changed = false;
          for (const field of Object.keys(next) as SettingField[]) {
            if (next[field] !== before[field] && current[field] === before[field]) {
              merged[field] = next[field];
              changed = true;
            }
          }
          return changed ? merged : current;
        });
      }),
    []
  );

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
    return Object.keys(names).map((value) => ({ value, label: names[value] as string }));
  }, []);

  const bibleAppOptions = useMemo(
    () => Object.entries(bibleAppNames).map(([value, label]) => ({ value, label })),
    []
  );

  const bibleVersionLabel =
    bibleVersionOptions.find((o) => o.value === drafts.preferredBibleVersion)?.label ??
    drafts.preferredBibleVersion;
  const bibleAppLabel =
    bibleAppOptions.find((o) => o.value === drafts.preferredBibleApp)?.label ??
    drafts.preferredBibleApp;

  function setFieldError(field: SettingField, message: string | undefined) {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }

  /** Stage an edit. Nothing leaves the screen until the field's Save is pressed. */
  function setDraft(field: SettingField, value: string) {
    setDrafts((prev) => ({ ...prev, [field]: value }));
    setFieldError(field, undefined);
  }

  /**
   * Persist one setting. Server-backed fields go to the API when possible and
   * fall back to device storage when signed out, offline, or the request fails.
   */
  async function commit(
    field: SettingField,
    patch: Partial<LocalUserSettings>,
    { syncToServer }: { syncToServer: boolean }
  ) {
    setFieldError(field, undefined);
    setSavingField(field);
    try {
      if (syncToServer && isAuthenticated) {
        const ok = await updateServerSettings(patch);
        if (ok) {
          showToast({ type: "success", message: t("settings_saved_successfully") });
          return;
        }
      }
      await setLocalSettings(patch);
      showToast({ type: "success", message: t("settings_saved_successfully") });
    } finally {
      setSavingField(null);
    }
  }

  async function saveDailyGoal() {
    const value = Number(drafts.dailyVerseCountGoal.trim());
    if (!Number.isInteger(value) || value < MIN_DAILY_GOAL || value > MAX_DAILY_GOAL) {
      setFieldError("dailyVerseCountGoal", t("settings_reading_daily_goal_invalid"));
      return;
    }
    await commit("dailyVerseCountGoal", { dailyVerseCountGoal: value }, { syncToServer: true });
  }

  async function saveLookBackDate() {
    const value = drafts.lookBackDate.trim();
    if (!isValidIsoDate(value)) {
      setFieldError("lookBackDate", t("settings_reading_look_back_date_invalid"));
      return;
    }
    await commit("lookBackDate", { lookBackDate: value }, { syncToServer: true });
  }

  async function savePreferredBibleVersion() {
    const value = drafts.preferredBibleVersion;
    if (!value) {
      setFieldError("preferredBibleVersion", t("settings_save_invalid"));
      return;
    }
    await commit("preferredBibleVersion", { preferredBibleVersion: value }, { syncToServer: true });
  }

  async function savePreferredBibleApp() {
    const value = drafts.preferredBibleApp;
    if (!value) {
      setFieldError("preferredBibleApp", t("settings_save_invalid"));
      return;
    }
    // Device-only (the API does not currently store this).
    await commit("preferredBibleApp", { preferredBibleApp: value }, { syncToServer: false });
  }

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SettingSection
          title={t("settings_reading_daily_goal_title")}
          dirty={drafts.dailyVerseCountGoal !== saved.dailyVerseCountGoal}
          saving={savingField === "dailyVerseCountGoal"}
          onSave={() => void saveDailyGoal()}
          onDiscard={() => setDraft("dailyVerseCountGoal", saved.dailyVerseCountGoal)}
          testIDPrefix="settings-reading.daily-goal"
        >
          <InputField
            value={drafts.dailyVerseCountGoal}
            onChangeText={(text) => setDraft("dailyVerseCountGoal", text)}
            error={errors.dailyVerseCountGoal}
            returnKeyType="done"
            keyboardType="number-pad"
            placeholder="86"
            testID="settings-reading.daily-goal-input"
          />
        </SettingSection>

        <SettingSection
          title={t("settings_reading_look_back_date_title")}
          dirty={drafts.lookBackDate !== saved.lookBackDate}
          saving={savingField === "lookBackDate"}
          onSave={() => void saveLookBackDate()}
          onDiscard={() => setDraft("lookBackDate", saved.lookBackDate)}
          testIDPrefix="settings-reading.look-back-date"
        >
          <InputField
            value={drafts.lookBackDate}
            onChangeText={(text) => setDraft("lookBackDate", text)}
            error={errors.lookBackDate}
            returnKeyType="done"
            placeholder="YYYY-MM-DD"
            testID="settings-reading.look-back-date-input"
          />
        </SettingSection>

        <SettingSection
          title={t("settings_reading_preferred_bible_version_title")}
          dirty={drafts.preferredBibleVersion !== saved.preferredBibleVersion}
          saving={savingField === "preferredBibleVersion"}
          onSave={() => void savePreferredBibleVersion()}
          onDiscard={() => setDraft("preferredBibleVersion", saved.preferredBibleVersion)}
          testIDPrefix="settings-reading.bible-version"
          error={errors.preferredBibleVersion}
        >
          <SelectRow
            value={bibleVersionLabel}
            placeholder={t("settings_select_option")}
            onPress={() => setBibleVersionOpen(true)}
            testID="settings-reading.bible-version-select"
          />
        </SettingSection>

        <SettingSection
          title={t("settings_reading_preferred_bible_app_title")}
          dirty={drafts.preferredBibleApp !== saved.preferredBibleApp}
          saving={savingField === "preferredBibleApp"}
          onSave={() => void savePreferredBibleApp()}
          onDiscard={() => setDraft("preferredBibleApp", saved.preferredBibleApp)}
          testIDPrefix="settings-reading.bible-app"
          error={errors.preferredBibleApp}
        >
          <SelectRow
            value={bibleAppLabel}
            placeholder={t("settings_select_option")}
            onPress={() => setBibleAppOpen(true)}
            testID="settings-reading.bible-app-select"
          />
        </SettingSection>

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
        selectedValue={drafts.preferredBibleVersion || null}
        onSelect={(v) => setDraft("preferredBibleVersion", String(v))}
        onClose={() => setBibleVersionOpen(false)}
      />

      <SelectSheet
        visible={bibleAppOpen}
        title={t("settings_reading_preferred_bible_app_title")}
        options={bibleAppOptions}
        selectedValue={drafts.preferredBibleApp || null}
        onSelect={(v) => setDraft("preferredBibleApp", String(v))}
        onClose={() => setBibleAppOpen(false)}
      />
    </Screen>
  );
}

/**
 * One setting: its label, its control, and an explicit Save. Save stays
 * disabled until the draft differs from what's stored and Discard only appears
 * while there is something to discard, so the section itself shows whether the
 * value on screen is the saved one.
 */
function SettingSection({
  title,
  dirty,
  saving,
  onSave,
  onDiscard,
  testIDPrefix,
  error,
  children,
}: {
  title: string;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  testIDPrefix: string;
  error?: string;
  children: ReactNode;
}) {
  const t = useT();

  return (
    <View style={styles.section}>
      <Text variant="label" color="mutedText">
        {title}
      </Text>
      {children}
      {!!error && (
        <Text variant="caption" color="destructive">
          {error}
        </Text>
      )}
      <View style={styles.actions}>
        <Button
          label={t("save")}
          size="sm"
          testID={`${testIDPrefix}-save`}
          disabled={!dirty}
          loading={saving}
          onPress={onSave}
        />
        {dirty && !saving ? (
          <Button
            label={t("discard")}
            size="sm"
            variant="ghost"
            testID={`${testIDPrefix}-discard`}
            onPress={onDiscard}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.pageGutter, paddingBottom: spacing.listBottom },
  section: { gap: spacing.xs, marginTop: spacing.md },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  help: { marginTop: spacing.md },
});
