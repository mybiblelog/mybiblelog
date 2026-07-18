import { useState } from "react";
import { StyleSheet, View } from "react-native";
import dayjs from "dayjs";
import { Bible } from "@mybiblelog/shared";
import { spacing } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { justOpenedActions, useJustOpened } from "@/src/stores/justOpened";
import { logEntryActions } from "@/src/stores/logEntries";
import type { LogEntry } from "@/src/types/log-entry";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";
import { BottomSheet } from "./BottomSheet";
import { LogEntryEditorModal } from "./LogEntryEditorModal";

/**
 * Global "Just Opened" prompt (web `JustOpenedModal.vue`). Rendered once at the
 * root layout; subscribes to the just-opened store, which `openPassageInBible`
 * raises after the user opens a passage in their external Bible app. "Log
 * Reading" hands off to a prefilled `LogEntryEditorModal` for today.
 */
export function JustOpenedModal() {
  const t = useT();
  const { locale } = useLocale();
  const { open, startVerseId, endVerseId } = useJustOpened();

  // Passage to log, captured when "Log Reading" is tapped so the editor keeps
  // its verses after the prompt itself is dismissed.
  const [logging, setLogging] = useState<LogEntry | null>(null);

  const passageName =
    startVerseId !== null && endVerseId !== null
      ? Bible.displayVerseRange(startVerseId, endVerseId, locale)
      : "";

  const handleLogReading = () => {
    justOpenedActions.dismiss();
    if (startVerseId === null || endVerseId === null) return;
    setLogging({ date: dayjs().format("YYYY-MM-DD"), startVerseId, endVerseId });
  };

  return (
    <>
      <BottomSheet visible={open} variant="center" onClose={justOpenedActions.dismiss}>
        <Text variant="heading" style={styles.title}>
          {t("just_opened_title")}
        </Text>
        <Text variant="body" color="mutedText" style={styles.message}>
          {t("just_opened_message", { passage: passageName })}
        </Text>
        <View style={styles.actions}>
          <Button
            label={t("just_opened_dismiss")}
            variant="secondary"
            onPress={justOpenedActions.dismiss}
          />
          <Button
            label={t("just_opened_log_reading")}
            testID="just-opened.log"
            onPress={handleLogReading}
          />
        </View>
      </BottomSheet>

      <LogEntryEditorModal
        visible={logging !== null}
        onClose={() => setLogging(null)}
        title={t("add_log_entry_title")}
        submitLabel={t("save")}
        initialEntry={logging ?? undefined}
        onSubmit={(entry) => {
          void logEntryActions.createEntry(entry);
          setLogging(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.xs },
  message: { marginBottom: spacing.lg },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
});
