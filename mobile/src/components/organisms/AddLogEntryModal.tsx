import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import type { LogEntry } from "@/src/types/log-entry";
import { useT } from "@/src/i18n/LocaleProvider";
import { spacing } from "@/src/design";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";
import { InputField } from "../molecules/InputField";
import { BottomSheet } from "./BottomSheet";

type Props = {
  visible: boolean;
  title?: string;
  submitLabel?: string;
  cancelLabel?: string;
  initialEntry?: LogEntry;
  onClose: () => void;
  onSubmit: (entry: LogEntry) => void;
};

/** Simple verse-id + date entry form (raw-id variant). */
export function AddLogEntryModal({
  visible,
  title,
  submitLabel,
  cancelLabel,
  initialEntry,
  onClose,
  onSubmit,
}: Props) {
  const t = useT();
  const resolvedTitle = title ?? t("add_log_entry_title");
  const resolvedSubmitLabel = submitLabel ?? t("save");
  const resolvedCancelLabel = cancelLabel ?? t("cancel");

  const [startVerseIdText, setStartVerseIdText] = useState("");
  const [endVerseIdText, setEndVerseIdText] = useState("");
  const [dateText, setDateText] = useState("");
  const wasVisible = useRef(false);

  const canSubmit = useMemo(() => {
    const start = Number(startVerseIdText);
    const end = Number(endVerseIdText);
    return (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start > 0 &&
      end > 0 &&
      end >= start &&
      dateText.trim().length > 0
    );
  }, [dateText, endVerseIdText, startVerseIdText]);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      if (initialEntry) {
        setStartVerseIdText(String(initialEntry.startVerseId));
        setEndVerseIdText(String(initialEntry.endVerseId));
        setDateText(initialEntry.date);
      } else {
        setStartVerseIdText("");
        setEndVerseIdText("");
        setDateText("");
      }
    }
    wasVisible.current = visible;
  }, [visible, initialEntry]);

  function handleSubmit() {
    const start = Number(startVerseIdText);
    const end = Number(endVerseIdText);
    const date = dateText.trim();

    if (!Number.isFinite(start) || !Number.isFinite(end) || !date) {
      Alert.alert(t("error_invalid_entry_title"), t("error_invalid_entry_message"));
      return;
    }
    if (start <= 0 || end <= 0) {
      Alert.alert(t("error_invalid_verses_title"), t("error_invalid_verses_message"));
      return;
    }
    if (end < start) {
      Alert.alert(t("error_invalid_range_title"), t("error_invalid_range_message"));
      return;
    }

    onSubmit({ startVerseId: start, endVerseId: end, date });
    onClose();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} swipeToDismiss={false}>
      <Text variant="heading" style={styles.title}>
        {resolvedTitle}
      </Text>

      <View style={styles.form}>
        <InputField
          label={t("start_verse_id_label")}
          value={startVerseIdText}
          onChangeText={setStartVerseIdText}
          placeholder={t("start_verse_id_placeholder")}
          keyboardType="number-pad"
          inputMode="numeric"
        />
        <InputField
          label={t("end_verse_id_label")}
          value={endVerseIdText}
          onChangeText={setEndVerseIdText}
          placeholder={t("end_verse_id_placeholder")}
          keyboardType="number-pad"
          inputMode="numeric"
        />
        <InputField
          label={t("date_label")}
          value={dateText}
          onChangeText={setDateText}
          placeholder={t("date_placeholder")}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.actions}>
        <Button label={resolvedCancelLabel} variant="secondary" onPress={onClose} />
        <Button label={resolvedSubmitLabel} onPress={handleSubmit} disabled={!canSubmit} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  form: { gap: spacing.lg, marginBottom: spacing.lg },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.md,
  },
});
