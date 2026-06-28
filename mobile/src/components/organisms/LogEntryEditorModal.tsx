import { Bible } from "@mybiblelog/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { LogEntry } from "@/src/types/log-entry";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { radius, spacing, useTheme } from "@/src/design";
import { useLogEntryEditor } from "@/src/log-entry-editor/useLogEntryEditor";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";
import { InputField } from "../molecules/InputField";
import { SelectRow } from "../molecules/SelectRow";
import { BottomSheet } from "./BottomSheet";
import { ConfirmDialog } from "./ConfirmDialog";
import { SelectSheet } from "./SelectSheet";

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
  const { reset, markClean } = editor;
  const wasVisible = useRef(false);

  const [bookOpen, setBookOpen] = useState(false);
  const [startChapterOpen, setStartChapterOpen] = useState(false);
  const [startVerseOpen, setStartVerseOpen] = useState(false);
  const [endChapterOpen, setEndChapterOpen] = useState(false);
  const [endVerseOpen, setEndVerseOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const bookOptions = useMemo(
    () =>
      editor.books.map((b: any) => ({
        value: b.bibleOrder as number,
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
      const init = initialEntry ?? (presetDate ? ({ date: presetDate } as any) : undefined);
      reset(init);
      markClean();
    }
    if (!visible && wasVisible.current) {
      setBookOpen(false);
      setStartChapterOpen(false);
      setStartVerseOpen(false);
      setEndChapterOpen(false);
      setEndVerseOpen(false);
      setDiscardOpen(false);
    }
    wasVisible.current = visible;
  }, [visible, initialEntry, presetDate, reset, markClean]);

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
          <InputField
            label={t("date")}
            value={editor.value.date}
            onChangeText={editor.updateDate}
            placeholder={t("date_placeholder")}
          />

          <SelectRow
            label={t("book")}
            value={selectedBookLabel}
            placeholder={t("choose_book")}
            onPress={() => setBookOpen(true)}
          />

          <View style={styles.row2}>
            <SelectRow
              label={t("start_chapter")}
              value={editor.value.startChapter || null}
              placeholder={t("choose_start_chapter")}
              disabled={editor.value.book === 0}
              onPress={() => setStartChapterOpen(true)}
            />
            <SelectRow
              label={t("start_verse")}
              value={editor.value.startVerse || null}
              placeholder={t("choose_start_verse")}
              disabled={editor.value.startChapter === 0}
              onPress={() => setStartVerseOpen(true)}
            />
          </View>

          <View style={styles.row2}>
            <SelectRow
              label={t("end_chapter")}
              value={editor.value.endChapter || null}
              placeholder={t("choose_end_chapter")}
              disabled={editor.value.startVerse === 0}
              onPress={() => setEndChapterOpen(true)}
            />
            <SelectRow
              label={t("end_verse")}
              value={editor.value.endVerse || null}
              placeholder={t("choose_end_verse")}
              disabled={editor.value.endChapter === 0}
              onPress={() => setEndVerseOpen(true)}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button label={t("close")} variant="secondary" onPress={requestClose} />
        </View>
      </BottomSheet>

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
  footer: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
