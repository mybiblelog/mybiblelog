import { Bible } from "@mybiblelog/shared";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { LogEntry } from "@/src/types/log-entry";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { ConfirmDialog } from "@/src/components/ConfirmDialog";
import { SelectSheet } from "@/src/components/SelectSheet";
import { useLogEntryEditor } from "@/src/log-entry-editor/useLogEntryEditor";

type Props = {
  visible: boolean;
  title: string;
  submitLabel: string;
  initialEntry?: LogEntry;
  /**
   * Optional date preset for "new entry" flows. Format: YYYY-MM-DD.
   * Ignored when `initialEntry` is provided.
   */
  presetDate?: string;
  onClose: () => void;
  onSubmit: (entry: LogEntry) => void;
};

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

  const [isRendered, setIsRendered] = useState(false);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(40)).current;

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
    const wasVisible = isRendered;

    if (visible && !wasVisible) {
      const init = initialEntry ?? (presetDate ? ({ date: presetDate } as any) : undefined);
      reset(init);
      markClean();
      setIsRendered(true);
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(40);

      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!visible && wasVisible) {
      setBookOpen(false);
      setStartChapterOpen(false);
      setStartVerseOpen(false);
      setEndChapterOpen(false);
      setEndVerseOpen(false);
      setDiscardOpen(false);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 40,
          duration: 160,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setIsRendered(false);
      });
    }
  }, [
    backdropOpacity,
    initialEntry,
    isRendered,
    markClean,
    presetDate,
    reset,
    sheetTranslateY,
    visible,
  ]);

  function handleSubmit() {
    const entry = editor.toLogEntry();
    if (!entry) return;
    onSubmit(entry);
    onClose();
  }

  const canSubmit = editor.derived.isValid;

  const selectedBookLabel =
    editor.value.book > 0 ? Bible.getBookName(editor.value.book, locale) : t("choose_book");

  return (
    <>
      <Modal
        visible={isRendered}
        animationType="none"
        transparent
        onRequestClose={requestClose}
      >
        <View style={styles.root}>
          <Animated.View
            pointerEvents={visible ? "auto" : "none"}
            style={[
              styles.backdrop,
              { opacity: backdropOpacity, backgroundColor: colors.backdrop },
            ]}
          >
            <Pressable style={styles.backdropPressTarget} onPress={requestClose} />
          </Animated.View>

          <Animated.View style={{ transform: [{ translateY: sheetTranslateY }] }}>
            <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
                <Pressable
                  style={[
                    styles.primaryButton,
                    { backgroundColor: colors.primary },
                    !canSubmit && styles.primaryButtonDisabled,
                  ]}
                  disabled={!canSubmit}
                  onPress={handleSubmit}
                >
                  <Text style={[styles.primaryButtonText, { color: colors.onPrimary }]}>
                    {submitLabel}
                  </Text>
                </Pressable>
              </View>

              <View
                style={[
                  styles.preview,
                  { backgroundColor: colors.primary, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.previewText, { color: colors.onPrimary }]}>
                  {displayRange || t("preview_passage")}
                </Text>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedText }]}>
                  {t("date")}
                </Text>
                <TextInput
                  value={editor.value.date}
                  onChangeText={editor.updateDate}
                  placeholder={t("date_placeholder")}
                  placeholderTextColor={colors.placeholder}
                  style={[
                    styles.input,
                    { borderColor: colors.border, color: colors.text },
                  ]}
                />
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.mutedText }]}>
                  {t("book")}
                </Text>
                <Pressable
                  style={[styles.select, { borderColor: colors.border }]}
                  onPress={() => setBookOpen(true)}
                >
                  <Text style={[styles.selectText, { color: colors.text }]}>
                    {selectedBookLabel}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.row2}>
                <View style={styles.row2Col}>
                  <Text style={[styles.label, { color: colors.mutedText }]}>
                    {t("start_chapter")}
                  </Text>
                  <Pressable
                    style={[
                      styles.select,
                      { borderColor: colors.border, opacity: editor.value.book ? 1 : 0.5 },
                    ]}
                    disabled={editor.value.book === 0}
                    onPress={() => setStartChapterOpen(true)}
                  >
                    <Text style={[styles.selectText, { color: colors.text }]}>
                      {editor.value.startChapter || t("choose_start_chapter")}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.row2Col}>
                  <Text style={[styles.label, { color: colors.mutedText }]}>
                    {t("start_verse")}
                  </Text>
                  <Pressable
                    style={[
                      styles.select,
                      {
                        borderColor: colors.border,
                        opacity: editor.value.startChapter ? 1 : 0.5,
                      },
                    ]}
                    disabled={editor.value.startChapter === 0}
                    onPress={() => setStartVerseOpen(true)}
                  >
                    <Text style={[styles.selectText, { color: colors.text }]}>
                      {editor.value.startVerse || t("choose_start_verse")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.row2}>
                <View style={styles.row2Col}>
                  <Text style={[styles.label, { color: colors.mutedText }]}>
                    {t("end_chapter")}
                  </Text>
                  <Pressable
                    style={[
                      styles.select,
                      {
                        borderColor: colors.border,
                        opacity: editor.value.startVerse ? 1 : 0.5,
                      },
                    ]}
                    disabled={editor.value.startVerse === 0}
                    onPress={() => setEndChapterOpen(true)}
                  >
                    <Text style={[styles.selectText, { color: colors.text }]}>
                      {editor.value.endChapter || t("choose_end_chapter")}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.row2Col}>
                  <Text style={[styles.label, { color: colors.mutedText }]}>
                    {t("end_verse")}
                  </Text>
                  <Pressable
                    style={[
                      styles.select,
                      { borderColor: colors.border, opacity: editor.value.endChapter ? 1 : 0.5 },
                    ]}
                    disabled={editor.value.endChapter === 0}
                    onPress={() => setEndVerseOpen(true)}
                  >
                    <Text style={[styles.selectText, { color: colors.text }]}>
                      {editor.value.endVerse || t("choose_end_verse")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.footer}>
                <Pressable
                  style={[styles.secondaryButton, { backgroundColor: colors.surfaceAlt }]}
                  onPress={requestClose}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.text }]}>
                    {t("close")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>

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
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropPressTarget: {
    flex: 1,
  },
  sheet: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  preview: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  previewText: {
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  field: {
    marginBottom: 12,
  },
  row2: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  row2Col: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  select: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  selectText: {
    fontSize: 16,
    fontWeight: "700",
  },
  footer: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  secondaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  primaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryButtonDisabled: {
    opacity: 0.4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "900",
  },
});

