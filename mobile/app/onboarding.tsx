import { Bible, bibleAppNames } from "@mybiblelog/shared";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Card,
  IconButton,
  InputField,
  Screen,
  SelectRow,
  SelectSheet,
  StepProgressDots,
  Text,
} from "@/src/components";
import { spacing } from "@/src/design";
import { formatLongDate } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { bibleVersionOptions } from "@/src/settings/bibleVersionOptions";
import { DAILY_GOAL_RANGE } from "@/src/settings/dailyGoalRange";
import { getGoalPlan } from "@/src/progress/outlook";
import { onboardingActions } from "@/src/stores/onboarding";
import { userSettingsActions, useSettingsValue } from "@/src/stores/userSettings";

type OnboardingStep = "choice" | "welcome" | "goal" | "bible" | "finish";

const TOTAL_STEPS = 3; // welcome, goal, bible — matches web's PillProgressBar count
const STEP_INDEX: Partial<Record<OnboardingStep, number>> = { welcome: 0, goal: 1, bible: 2 };

async function finishOnboarding() {
  await onboardingActions.markOnboardingCompleted();
  router.replace("/");
}

export default function Onboarding() {
  const [step, setStep] = useState<OnboardingStep>("choice");
  const settings = useSettingsValue();

  return (
    <Screen edges={["top", "bottom"]} padded>
      {step !== "choice" && step !== "finish" ? (
        <Image
          source={require("../assets/images/splash-icon.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
      ) : null}

      {STEP_INDEX[step] !== undefined ? (
        <View style={styles.progress}>
          <StepProgressDots currentStep={STEP_INDEX[step]!} totalSteps={TOTAL_STEPS} />
        </View>
      ) : null}

      {step === "choice" ? <ChoiceStep onNew={() => setStep("welcome")} /> : null}
      {step === "welcome" ? (
        <WelcomeStep
          onNext={() => setStep("goal")}
          onSkip={() => void finishOnboarding()}
          onBack={() => setStep("choice")}
        />
      ) : null}
      {step === "goal" ? (
        <GoalStep onBack={() => setStep("welcome")} onNext={() => setStep("bible")} />
      ) : null}
      {step === "bible" ? (
        <BibleStep
          initialVersion={settings?.preferredBibleVersion ?? ""}
          initialApp={settings?.preferredBibleApp ?? ""}
          onBack={() => setStep("goal")}
          onNext={() => setStep("finish")}
        />
      ) : null}
      {step === "finish" ? <FinishStep onDone={() => void finishOnboarding()} /> : null}
    </Screen>
  );
}

function ChoiceStep({ onNew }: { onNew: () => void }) {
  const t = useT();
  return (
    <View style={styles.centeredStep}>
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={styles.largeLogo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text variant="title" style={[styles.title, styles.centerText]}>
        {t("onboarding_choice_title")}
      </Text>
      <View style={styles.choiceButtons}>
        <Button
          label={t("onboarding_choice_new")}
          testID="onboarding.choice-new"
          fullWidth
          onPress={onNew}
        />
        <Button
          label={t("onboarding_choice_login")}
          variant="secondary"
          testID="onboarding.choice-login"
          fullWidth
          // `push`, not `replace`: leaves onboarding on the back stack so the
          // login screen's native back button/gesture returns here instead of
          // exiting the app. `login.tsx`'s own `goAfterAuth()` already prefers
          // `router.back()` when possible, which lands here on cancel and on
          // `(tabs)` after a successful sign-in (the onboarding screen's
          // `Stack.Protected` guard flips false once authenticated, so
          // navigating "back" into it redirects straight through).
          onPress={() => router.push("/login")}
        />
      </View>
    </View>
  );
}

function WelcomeStep({
  onNext,
  onSkip,
  onBack,
}: {
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const t = useT();
  return (
    <View style={styles.centeredStep}>
      <Text variant="title" style={styles.title}>
        {t("onboarding_welcome_title")}
      </Text>
      <Text variant="body" color="mutedText" style={styles.description}>
        {t("onboarding_welcome_description")}
      </Text>
      <View style={styles.stepButtons}>
        <Button
          label={t("onboarding_welcome_next")}
          testID="onboarding.welcome-next"
          fullWidth
          onPress={onNext}
        />
        <Button
          label={t("onboarding_welcome_skip")}
          variant="ghost"
          testID="onboarding.welcome-skip"
          fullWidth
          onPress={onSkip}
        />
        <Button label={t("back")} variant="ghost" size="sm" onPress={onBack} />
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="caption" color="mutedText">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

function GoalStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const t = useT();
  const { locale } = useLocale();
  const totalVerses = Bible.getTotalVerseCount();
  const today = dayjs().format("YYYY-MM-DD");
  const yearDate = dayjs(today).add(1, "year").format("YYYY-MM-DD");
  const yearPlan = getGoalPlan(totalVerses, today, yearDate);

  const [draft, setDraft] = useState(String(yearPlan?.versesPerDay ?? ""));
  const [error, setError] = useState<string | null>(null);

  const formatCount = (n: number) => n.toLocaleString(locale);

  const goal = Number(draft.trim());
  const goalValid =
    Number.isInteger(goal) && goal >= DAILY_GOAL_RANGE.min && goal <= DAILY_GOAL_RANGE.max;
  const days = goalValid ? Math.ceil(totalVerses / goal) : null;
  const finishDate = days !== null ? dayjs(today).add(days, "day").format("YYYY-MM-DD") : null;

  function handleDraftChange(text: string) {
    setDraft(text);
    setError(null);
  }

  function adjustGoal(delta: number) {
    const current = goalValid ? goal : (yearPlan?.versesPerDay ?? DAILY_GOAL_RANGE.min);
    const next = Math.min(DAILY_GOAL_RANGE.max, Math.max(DAILY_GOAL_RANGE.min, current + delta));
    handleDraftChange(String(next));
  }

  async function handleNext() {
    if (!goalValid) {
      setError(t("settings_reading_daily_goal_invalid"));
      return;
    }
    setError(null);
    await userSettingsActions.setLocalSettingsWithPendingSync({ dailyVerseCountGoal: goal });
    onNext();
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text variant="title" style={styles.title}>
          {t("onboarding_goal_title")}
        </Text>
        <Text variant="body" color="mutedText" style={styles.description}>
          {t("onboarding_goal_description")}
        </Text>

        <Card style={styles.goalCard}>
          <Text variant="label" color="mutedText">
            {t("onboarding_goal_daily_verse_count")}
          </Text>
          <View style={styles.stepperRow}>
            <IconButton
              name="remove-circle-outline"
              accessibilityLabel={t("onboarding_goal_decrease")}
              disabled={goalValid && goal <= DAILY_GOAL_RANGE.min}
              onPress={() => adjustGoal(-1)}
              testID="onboarding.goal-decrease"
            />
            <View style={styles.stepperInput}>
              <InputField
                value={draft}
                onChangeText={handleDraftChange}
                error={error ?? undefined}
                keyboardType="number-pad"
                returnKeyType="done"
                textAlign="center"
                placeholder="86"
                testID="onboarding.goal-verses-input"
              />
            </View>
            <IconButton
              name="add-circle-outline"
              accessibilityLabel={t("onboarding_goal_increase")}
              disabled={goalValid && goal >= DAILY_GOAL_RANGE.max}
              onPress={() => adjustGoal(1)}
              testID="onboarding.goal-increase"
            />
          </View>

          {days !== null && finishDate ? (
            <View style={styles.optionList}>
              <DetailRow label={t("onboarding_goal_days_to_read")} value={formatCount(days)} />
              <DetailRow
                label={t("onboarding_goal_finish_on")}
                value={formatLongDate(finishDate, locale)}
              />
            </View>
          ) : null}
        </Card>

        <Text variant="caption" color="mutedText" style={styles.hint}>
          {t("onboarding_goal_change_hint")}
        </Text>

        <View style={styles.stepButtons}>
          <Button
            label={t("onboarding_continue")}
            testID="onboarding.goal-next"
            fullWidth
            onPress={() => void handleNext()}
          />
          <Button label={t("back")} variant="ghost" size="sm" onPress={onBack} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function BibleStep({
  initialVersion,
  initialApp,
  onBack,
  onNext,
}: {
  initialVersion: string;
  initialApp: string;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useT();
  const [version, setVersion] = useState(initialVersion);
  const [app, setApp] = useState(initialApp);
  const [versionOpen, setVersionOpen] = useState(false);
  const [appOpen, setAppOpen] = useState(false);

  const bibleAppOptions = Object.entries(bibleAppNames).map(([value, label]) => ({ value, label }));
  const versionLabel = bibleVersionOptions.find((o) => o.value === version)?.label ?? version;
  const appLabel = bibleAppOptions.find((o) => o.value === app)?.label ?? app;

  async function handleNext() {
    if (!version || !app) return;
    await userSettingsActions.setLocalSettingsWithPendingSync({
      preferredBibleVersion: version,
      preferredBibleApp: app,
    });
    onNext();
  }

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="title" style={styles.title}>
          {t("onboarding_bible_title")}
        </Text>

        <Card style={styles.fieldGroup}>
          <Text variant="label" color="mutedText">
            {t("onboarding_bible_translation_label")}
          </Text>
          <SelectRow
            value={versionLabel}
            placeholder={t("settings_select_option")}
            onPress={() => setVersionOpen(true)}
            testID="onboarding.bible-version-select"
          />
        </Card>

        <Card style={styles.fieldGroup}>
          <Text variant="label" color="mutedText">
            {t("onboarding_bible_app_label")}
          </Text>
          <SelectRow
            value={appLabel}
            placeholder={t("settings_select_option")}
            onPress={() => setAppOpen(true)}
            testID="onboarding.bible-app-select"
          />
        </Card>

        <Text variant="caption" color="mutedText" style={styles.hint}>
          {t("onboarding_bible_change_hint")}
        </Text>

        <View style={styles.stepButtons}>
          <Button
            label={t("onboarding_continue")}
            testID="onboarding.bible-next"
            fullWidth
            disabled={!version || !app}
            onPress={() => void handleNext()}
          />
          <Button label={t("back")} variant="ghost" size="sm" onPress={onBack} />
        </View>
      </ScrollView>

      <SelectSheet
        visible={versionOpen}
        title={t("onboarding_bible_translation_label")}
        options={bibleVersionOptions}
        selectedValue={version || null}
        onSelect={(v) => setVersion(String(v))}
        onClose={() => setVersionOpen(false)}
      />
      <SelectSheet
        visible={appOpen}
        title={t("onboarding_bible_app_label")}
        options={bibleAppOptions}
        selectedValue={app || null}
        onSelect={(v) => setApp(String(v))}
        onClose={() => setAppOpen(false)}
      />
    </View>
  );
}

function FinishStep({ onDone }: { onDone: () => void }) {
  const t = useT();
  return (
    <View style={styles.centeredStep}>
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={styles.largeLogo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
      <Text variant="title" style={[styles.title, styles.centerText]}>
        {t("onboarding_finish_title")}
      </Text>
      <Text variant="body" color="mutedText" style={[styles.description, styles.centerText]}>
        {t("onboarding_finish_description")}
      </Text>
      <Button
        label={t("onboarding_finish_button")}
        testID="onboarding.finish"
        fullWidth
        onPress={onDone}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  logo: {
    width: 64,
    height: 64,
    alignSelf: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  largeLogo: {
    width: 120,
    height: 120,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  progress: { alignItems: "center", marginBottom: spacing.lg },
  centeredStep: { flex: 1, justifyContent: "center", gap: spacing.sm },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.listBottom, gap: spacing.sm },
  title: { marginBottom: spacing["2xs"] },
  centerText: { textAlign: "center" },
  description: { marginBottom: spacing.sm },
  choiceButtons: { gap: spacing.sm, marginTop: spacing.lg },
  stepButtons: { gap: spacing.sm, marginTop: spacing.lg, alignItems: "stretch" },
  goalCard: { gap: spacing.md, marginHorizontal: spacing["2xs"] },
  stepperRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.xs },
  stepperInput: { flex: 1 },
  optionList: { gap: spacing.sm },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },
  hint: { marginTop: spacing.xs },
  fieldGroup: { gap: spacing["2xs"], marginBottom: spacing.md, marginHorizontal: spacing["2xs"] },
});
