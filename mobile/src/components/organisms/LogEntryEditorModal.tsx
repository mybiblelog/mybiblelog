import { Bible } from "@mybiblelog/shared";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { LogEntry } from "@/src/types/log-entry";
import { formatLongDate, parseYmdToDate } from "@/src/i18n/date";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { radius, spacing, useTheme } from "@/src/design";
import { useLogEntryEditor } from "@/src/log-entry-editor/useLogEntryEditor";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";
import { InputField } from "../molecules/InputField";
import { SelectRow } from "../molecules/SelectRow";
import { BottomSheet } from "./BottomSheet";
import { ConfirmDialog } from "./ConfirmDialog";
import { DatePickerSheet } from "./DatePickerSheet";
import { SelectSheet } from "./SelectSheet";

/** `Date` -> `YYYY-MM-DD`, built from local components (never `new Date(string)` /
 *  ISO string round-trips, which shift by timezone). */
function toYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

type Props = {
  visible: boolean;
  title: string;
  submitLabel: string;
  initialEntry?: LogEntry;
  /** Optional date preset for "new entry" flows (YYYY-MM-DD). */
  presetDate?: string;
  onClose: () => void;
  onSubmit: (entry: LogEntry) => void;
};

/** Structured book/chapter/verse log-entry editor. */
export function LogEntryEditorModal({
  visible,
  title,
  submitLabel,
  initialEntry,
  presetDate,
  onClose,
  onSubmit,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();

  const editor = useLogEntryEditor(initialEntry ?? undefined);
  const { reset } = editor;
  const wasVisible = useRef(false);

  const [bookOpen, setBookOpen] = useState(false);
  const [startChapterOpen, setStartChapterOpen] = useState(false);
  const [startVerseOpen, setStartVerseOpen] = useState(false);
  const [endChapterOpen, setEndChapterOpen] = useState(false);
  const [endVerseOpen, setEndVerseOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const selectedDate = useMemo(
    () => parseYmdToDate(editor.value.date) ?? new Date(),
    [editor.value.date]
  );

  function openDatePicker() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: selectedDate,
        mode: "date",
        onChange: (_event, date) => {
          if (date) editor.updateDate(toYmd(date));
        },
      });
      return;
    }
    setDatePickerOpen(true);
  }

  const bookOptions = useMemo(
    () =>
      editor.books.map((b) => ({
        value: b.bibleOrder,
        label: Bible.getBookName(b.bibleOrder, locale),
      })),
    [editor.books, locale]
  );

  const displayRange = useMemo(() => {
    if (editor.derived.startVerseId && editor.derived.endVerseId) {
      return Bible.displayVerseRange(
        editor.derived.startVerseId,
        editor.derived.endVerseId,
        locale
      );
    }
    return null;
  }, [editor.derived.endVerseId, editor.derived.startVerseId, locale]);

  function requestClose() {
    if (editor.derived.isDirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  }

  useEffect(() => {
    if (visible && !wasVisible.current) {
      const init = initialEntry ?? (presetDate ? { date: presetDate } : undefined);
      // reset() establishes the clean baseline.
      reset(init);
    }
    if (!visible && wasVisible.current) {
      setBookOpen(false);
      setStartChapterOpen(false);
      setStartVerseOpen(false);
      setEndChapterOpen(false);
      setEndVerseOpen(false);
      setDiscardOpen(false);
      setDatePickerOpen(false);
    }
    wasVisible.current = visible;
  }, [visible, initialEntry, presetDate, reset]);

  function handleSubmit() {
    const entry = editor.toLogEntry();
    if (!entry) return;
    onSubmit(entry);
    onClose();
  }

  const canSubmit = editor.derived.isValid;
  const selectedBookLabel =
    editor.value.book > 0 ? Bible.getBookName(editor.value.book, locale) : null;

  return (
    <>
      <BottomSheet visible={visible} onClose={requestClose} swipeToDismiss={false}>
        <View style={styles.header}>
          <Text variant="heading" style={styles.headerTitle}>
            {title}
          </Text>
          <Button
            label={submitLabel}
            testID="entry-editor.save"
            size="sm"
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
        </View>

        <View style={[styles.preview, { backgroundColor: colors.primary }]}>
          <Text variant="bodyStrong" color="onPrimary" style={styles.previewText}>
            {displayRange || t("preview_passage")}
          </Text>
        </View>

        <View style={styles.form}>
          {Platform.OS === "web" ? (
            <InputField
              label={t("date")}
              value={editor.value.date}
              onChangeText={editor.updateDate}
              placeholder={t("date_placeholder")}
            />
          ) : (
            <SelectRow
              label={t("date")}
              value={editor.value.date ? formatLongDate(editor.value.date, locale) : null}
              placeholder={t("date_placeholder")}
              onPress={openDatePicker}
            />
          )}

          <SelectRow
            label={t("book")}
            testID="entry-editor.book"
            value={selectedBookLabel}
            placeholder={t("choose_book")}
            onPress={() => setBookOpen(true)}
          />

          <View style={styles.row2}>
            <SelectRow
              label={t("start_chapter")}
              testID="entry-editor.start-chapter"
              value={editor.value.startChapter || null}
              placeholder={t("choose_start_chapter")}
              disabled={editor.value.book === 0}
              onPress={() => setStartChapterOpen(true)}
              style={styles.row2Item}
            />
            <SelectRow
              label={t("start_verse")}
              testID="entry-editor.start-verse"
              value={editor.value.startVerse || null}
              placeholder={t("choose_start_verse")}
              disabled={editor.value.startChapter === 0}
              onPress={() => setStartVerseOpen(true)}
              style={styles.row2Item}
            />
          </View>

          <View style={styles.row2}>
            <SelectRow
              label={t("end_chapter")}
              testID="entry-editor.end-chapter"
              value={editor.value.endChapter || null}
              placeholder={t("choose_end_chapter")}
              disabled={editor.value.startVerse === 0}
              onPress={() => setEndChapterOpen(true)}
              style={styles.row2Item}
            />
            <SelectRow
              label={t("end_verse")}
              testID="entry-editor.end-verse"
              value={editor.value.endVerse || null}
              placeholder={t("choose_end_verse")}
              disabled={editor.value.endChapter === 0}
              onPress={() => setEndVerseOpen(true)}
              style={styles.row2Item}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button label={t("close")} variant="secondary" onPress={requestClose} />
        </View>
      </BottomSheet>

      <DatePickerSheet
        visible={datePickerOpen}
        value={selectedDate}
        onChange={(date) => editor.updateDate(toYmd(date))}
        onClose={() => setDatePickerOpen(false)}
      />
      <SelectSheet
        visible={bookOpen}
        title={t("book")}
        options={bookOptions}
        selectedValue={editor.value.book > 0 ? editor.value.book : null}
        onSelect={(v) => editor.selectBook(v)}
        onClose={() => setBookOpen(false)}
      />
      <SelectSheet
        visible={startChapterOpen}
        title={t("start_chapter")}
        options={editor.startChapters.map((c) => ({ value: c, label: String(c) }))}
        selectedValue={editor.value.startChapter || null}
        onSelect={(v) => editor.selectStartChapter(v)}
        onClose={() => setStartChapterOpen(false)}
      />
      <SelectSheet
        visible={startVerseOpen}
        title={t("start_verse")}
        options={editor.startVerses.map((v) => ({ value: v, label: String(v) }))}
        selectedValue={editor.value.startVerse || null}
        onSelect={(v) => editor.selectStartVerse(v)}
        onClose={() => setStartVerseOpen(false)}
      />
      <SelectSheet
        visible={endChapterOpen}
        title={t("end_chapter")}
        options={editor.endChapters.map((c) => ({ value: c, label: String(c) }))}
        selectedValue={editor.value.endChapter || null}
        onSelect={(v) => editor.selectEndChapter(v)}
        onClose={() => setEndChapterOpen(false)}
      />
      <SelectSheet
        visible={endVerseOpen}
        title={t("end_verse")}
        options={editor.endVerses.map((v) => ({ value: v, label: String(v) }))}
        selectedValue={editor.value.endVerse || null}
        onSelect={(v) => editor.selectEndVerse(v)}
        onClose={() => setEndVerseOpen(false)}
      />

      <ConfirmDialog
        visible={discardOpen}
        title={t("discard_changes_title")}
        message={t("discard_changes_message")}
        cancelLabel={t("cancel")}
        confirmLabel={t("discard")}
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => {
          setDiscardOpen(false);
          onClose();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: { flex: 1 },
  preview: {
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  previewText: { textAlign: "center" },
  form: { gap: spacing.lg },
  row2: { flexDirection: "row", gap: spacing.md },
  row2Item: { flex: 1 },
  footer: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
