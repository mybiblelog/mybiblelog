import { Bible } from "@mybiblelog/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { NotePassage } from "@/src/api/notesApi";
import { radius, spacing, useTheme } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { usePassageSelection } from "@/src/notes/usePassageSelection";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";
import { SelectRow } from "../molecules/SelectRow";
import { BottomSheet } from "./BottomSheet";
import { SelectSheet } from "./SelectSheet";

type Props = {
  visible: boolean;
  title: string;
  /** Pre-populate when editing an existing passage. */
  initialRange?: NotePassage | null;
  onSubmit: (range: NotePassage) => void;
  onClose: () => void;
};

/**
 * Book/chapter/verse range picker on a bottom sheet — the log-entry editor's
 * passage cascade without the date, reused for note passages and the notes
 * passage filter.
 */
export function PassageRangeSheet({ visible, title, initialRange, onSubmit, onClose }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();

  const selection = usePassageSelection(initialRange);
  const { reset } = selection;
  const wasVisible = useRef(false);

  const [bookOpen, setBookOpen] = useState(false);
  const [startChapterOpen, setStartChapterOpen] = useState(false);
  const [startVerseOpen, setStartVerseOpen] = useState(false);
  const [endChapterOpen, setEndChapterOpen] = useState(false);
  const [endVerseOpen, setEndVerseOpen] = useState(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      reset(initialRange);
    }
    if (!visible && wasVisible.current) {
      setBookOpen(false);
      setStartChapterOpen(false);
      setStartVerseOpen(false);
      setEndChapterOpen(false);
      setEndVerseOpen(false);
    }
    wasVisible.current = visible;
  }, [visible, initialRange, reset]);

  const bookOptions = useMemo(
    () =>
      Bible.getBooks().map((b) => ({
        value: b.bibleOrder,
        label: Bible.getBookName(b.bibleOrder, locale),
      })),
    [locale]
  );

  const displayRange = selection.range
    ? Bible.displayVerseRange(selection.range.startVerseId, selection.range.endVerseId, locale)
    : null;

  function handleSubmit() {
    if (!selection.isValid || !selection.range) return;
    onSubmit({
      startVerseId: selection.range.startVerseId,
      endVerseId: selection.range.endVerseId,
    });
    onClose();
  }

  const selectedBookLabel =
    selection.state.book > 0 ? Bible.getBookName(selection.state.book, locale) : null;

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} swipeToDismiss={false}>
        <View style={styles.header}>
          <Text variant="heading" style={styles.headerTitle}>
            {title}
          </Text>
          <Button
            label={t("done")}
            size="sm"
            onPress={handleSubmit}
            disabled={!selection.isValid}
          />
        </View>

        <View style={[styles.preview, { backgroundColor: colors.primary }]}>
          <Text variant="bodyStrong" color="onPrimary" style={styles.previewText}>
            {displayRange || t("preview_passage")}
          </Text>
        </View>

        <View style={styles.form}>
          <SelectRow
            label={t("book")}
            value={selectedBookLabel}
            placeholder={t("choose_book")}
            onPress={() => setBookOpen(true)}
          />

          <View style={styles.row2}>
            <SelectRow
              label={t("start_chapter")}
              value={selection.state.startChapter || null}
              placeholder={t("choose_start_chapter")}
              disabled={selection.state.book === 0}
              onPress={() => setStartChapterOpen(true)}
              style={styles.row2Item}
            />
            <SelectRow
              label={t("start_verse")}
              value={selection.state.startVerse || null}
              placeholder={t("choose_start_verse")}
              disabled={selection.state.startChapter === 0}
              onPress={() => setStartVerseOpen(true)}
              style={styles.row2Item}
            />
          </View>

          <View style={styles.row2}>
            <SelectRow
              label={t("end_chapter")}
              value={selection.state.endChapter || null}
              placeholder={t("choose_end_chapter")}
              disabled={selection.state.startVerse === 0}
              onPress={() => setEndChapterOpen(true)}
              style={styles.row2Item}
            />
            <SelectRow
              label={t("end_verse")}
              value={selection.state.endVerse || null}
              placeholder={t("choose_end_verse")}
              disabled={selection.state.endChapter === 0}
              onPress={() => setEndVerseOpen(true)}
              style={styles.row2Item}
            />
          </View>
        </View>

        <View style={styles.footer}>
          <Button label={t("close")} variant="secondary" onPress={onClose} />
        </View>
      </BottomSheet>

      <SelectSheet
        visible={bookOpen}
        title={t("book")}
        options={bookOptions}
        selectedValue={selection.state.book > 0 ? selection.state.book : null}
        onSelect={selection.selectBook}
        onClose={() => setBookOpen(false)}
      />
      <SelectSheet
        visible={startChapterOpen}
        title={t("start_chapter")}
        options={selection.options.startChapters.map((c) => ({ value: c, label: String(c) }))}
        selectedValue={selection.state.startChapter || null}
        onSelect={selection.selectStartChapter}
        onClose={() => setStartChapterOpen(false)}
      />
      <SelectSheet
        visible={startVerseOpen}
        title={t("start_verse")}
        options={selection.options.startVerses.map((v) => ({ value: v, label: String(v) }))}
        selectedValue={selection.state.startVerse || null}
        onSelect={selection.selectStartVerse}
        onClose={() => setStartVerseOpen(false)}
      />
      <SelectSheet
        visible={endChapterOpen}
        title={t("end_chapter")}
        options={selection.options.endChapters.map((c) => ({ value: c, label: String(c) }))}
        selectedValue={selection.state.endChapter || null}
        onSelect={selection.selectEndChapter}
        onClose={() => setEndChapterOpen(false)}
      />
      <SelectSheet
        visible={endVerseOpen}
        title={t("end_verse")}
        options={selection.options.endVerses.map((v) => ({ value: v, label: String(v) }))}
        selectedValue={selection.state.endVerse || null}
        onSelect={selection.selectEndVerse}
        onClose={() => setEndVerseOpen(false)}
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
