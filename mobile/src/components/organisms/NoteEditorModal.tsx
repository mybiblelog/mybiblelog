import { Bible } from "@mybiblelog/shared";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { NoteInput, NotePassage, PassageNote } from "@/src/api/notesApi";
import { radius, spacing, TOUCH_TARGET, useScalePress, useTheme } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useTagsList } from "@/src/stores/passageNoteTags";
import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { TagPill } from "../atoms/TagPill";
import { Text } from "../atoms/Text";
import { AnimatedPressable } from "../atoms/AnimatedPressable";
import { InputField } from "../molecules/InputField";
import { BottomSheet } from "./BottomSheet";
import { ConfirmDialog } from "./ConfirmDialog";
import { PassageRangeSheet } from "./PassageRangeSheet";
import { TagSelectorSheet } from "./TagSelectorSheet";

export const NOTE_CONTENT_MAX_LENGTH = 3000;

type Props = {
  visible: boolean;
  /** Edit this note; omit to create a new one. */
  initialNote?: PassageNote | null;
  /** Pre-fill a new note with these passages (ignored when editing). */
  initialPassages?: NotePassage[];
  onClose: () => void;
  onSubmit: (input: NoteInput & { id?: string }) => void;
};

type Draft = {
  content: string;
  passages: NotePassage[];
  tags: string[];
};

const emptyDraft = (): Draft => ({ content: "", passages: [], tags: [] });

const draftFromNote = (note: PassageNote): Draft => ({
  content: note.content,
  passages: note.passages.map((p) => ({ ...p })),
  tags: [...note.tags],
});

/**
 * Note create/edit modal (web `PassageNoteEditorModal` equivalent): passages,
 * content, tags. The passage picker, tag selector, and (via the selector) tag
 * editor stack as sibling Modals — the same mechanism as the log-entry editor.
 */
export function NoteEditorModal({
  visible,
  initialNote,
  initialPassages,
  onClose,
  onSubmit,
}: Props) {
  const t = useT();
  const { locale } = useLocale();
  const tags = useTagsList();
  const wasVisible = useRef(false);

  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [cleanJson, setCleanJson] = useState<string>(() => JSON.stringify(emptyDraft()));
  // Index of the passage being edited, or "new", or null when the picker is closed.
  const [editingPassage, setEditingPassage] = useState<number | "new" | null>(null);
  const [choosingTags, setChoosingTags] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  // Index of the passage pending removal confirmation, or null.
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      const next = initialNote
        ? draftFromNote(initialNote)
        : { ...emptyDraft(), passages: (initialPassages ?? []).map((p) => ({ ...p })) };
      setDraft(next);
      setCleanJson(JSON.stringify(next));
      setEditingPassage(null);
      setChoosingTags(false);
      setDiscardOpen(false);
      setConfirmRemoveIndex(null);
    }
    wasVisible.current = visible;
  }, [visible, initialNote, initialPassages]);

  const isDirty = JSON.stringify(draft) !== cleanJson;
  // Mirrors the server rule: a note needs content or at least one passage.
  const canSubmit = draft.content.trim().length > 0 || draft.passages.length > 0;

  function requestClose() {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    onClose();
  }

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      ...(initialNote ? { id: initialNote.id } : {}),
      content: draft.content,
      passages: draft.passages,
      tags: draft.tags,
    });
    onClose();
  }

  function handlePassageSubmit(range: NotePassage) {
    setDraft((prev) => {
      if (editingPassage === "new" || editingPassage === null) {
        return { ...prev, passages: [...prev.passages, range] };
      }
      const passages = [...prev.passages];
      passages[editingPassage] = range;
      return { ...prev, passages };
    });
  }

  function removePassage(index: number) {
    setDraft((prev) => ({
      ...prev,
      passages: prev.passages.filter((_, i) => i !== index),
    }));
  }

  const selectedTags = draft.tags
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined);

  const editingRange =
    typeof editingPassage === "number" ? (draft.passages[editingPassage] ?? null) : null;

  return (
    <>
      <BottomSheet visible={visible} onClose={requestClose} variant="full" swipeToDismiss={false}>
        <View style={styles.header}>
          <Text variant="heading" style={styles.headerTitle}>
            {initialNote ? t("note_editor_edit") : t("note_editor_new")}
          </Text>
          <Button
            label={t("save")}
            testID="note-editor.save"
            size="sm"
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="label" color="mutedText">
                {t("note_passages")}
              </Text>
              <Button
                label={t("note_add_passage")}
                size="sm"
                variant="secondary"
                leftIcon="add"
                onPress={() => setEditingPassage("new")}
              />
            </View>
            {draft.passages.length === 0 ? (
              <Text variant="caption" color="mutedText">
                {t("note_no_passages")}
              </Text>
            ) : (
              draft.passages.map((passage, index) => (
                <View
                  key={`${passage.startVerseId}-${passage.endVerseId}-${index}`}
                  style={styles.passageRow}
                >
                  <PassageButton
                    label={Bible.displayVerseRange(
                      passage.startVerseId,
                      passage.endVerseId,
                      locale
                    )}
                    editLabel={t("edit")}
                    onPress={() => setEditingPassage(index)}
                  />
                  <IconButton
                    name="trash-outline"
                    accessibilityLabel={t("delete")}
                    onPress={() => setConfirmRemoveIndex(index)}
                  />
                </View>
              ))
            )}
          </View>

          <InputField
            label={t("note_content")}
            testID="note-editor.content"
            value={draft.content}
            onChangeText={(content) => setDraft((prev) => ({ ...prev, content }))}
            maxLength={NOTE_CONTENT_MAX_LENGTH}
            placeholder={t("note_content_placeholder")}
            multiline
            numberOfLines={5}
            style={styles.contentInput}
          />
          <Text variant="caption" color="mutedText" style={styles.charCount}>
            {draft.content.length}/{NOTE_CONTENT_MAX_LENGTH}
          </Text>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="label" color="mutedText">
                {t("note_tags")}
              </Text>
              <Button
                label={t("note_manage_tags")}
                testID="note-editor.choose-tags"
                size="sm"
                variant="secondary"
                onPress={() => setChoosingTags(true)}
              />
            </View>
            {selectedTags.length === 0 ? (
              <Text variant="caption" color="mutedText">
                {t("note_no_tags_selected")}
              </Text>
            ) : (
              <View style={styles.pillRow}>
                {selectedTags.map((tag) => (
                  <TagPill key={tag.id} label={tag.label} color={tag.color} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label={t("close")} variant="secondary" onPress={requestClose} />
        </View>
      </BottomSheet>

      <PassageRangeSheet
        visible={editingPassage !== null}
        title={editingPassage === "new" ? t("note_add_passage") : t("note_edit_passage")}
        initialRange={editingRange}
        onSubmit={handlePassageSubmit}
        onClose={() => setEditingPassage(null)}
      />

      <TagSelectorSheet
        visible={choosingTags}
        selectedTagIds={draft.tags}
        allowCreate
        onDone={(tagIds) => setDraft((prev) => ({ ...prev, tags: tagIds }))}
        onClose={() => setChoosingTags(false)}
      />

      <ConfirmDialog
        visible={confirmRemoveIndex !== null}
        title={t("note_passage_remove_confirm_title")}
        message={t("note_passage_remove_confirm_message")}
        cancelLabel={t("cancel")}
        confirmLabel={t("delete")}
        onCancel={() => setConfirmRemoveIndex(null)}
        onConfirm={() => {
          if (confirmRemoveIndex !== null) removePassage(confirmRemoveIndex);
          setConfirmRemoveIndex(null);
        }}
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

/**
 * A saved passage in the list. Carries the same bordered, touch-target-sized
 * chrome as `SelectRow` so it reads as "tap to change", not as static text.
 */
function PassageButton({
  label,
  editLabel,
  onPress,
}: {
  label: string;
  editLabel: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const press = useScalePress({ scaleTo: 0.98 });

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${editLabel}: ${label}`}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[
        styles.passageButton,
        // Radius rides along with the backgroundColor: an Android bg-only style
        // update drops a separately-registered borderRadius.
        {
          borderColor: colors.border,
          backgroundColor: colors.surfaceMuted,
          borderRadius: radius.xl,
        },
        press.animatedStyle,
      ]}
    >
      <Text variant="bodyStrong">{label}</Text>
      <Icon name="create-outline" size={16} color="mutedText" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: { flex: 1 },
  // Shrinks to whatever the sheet has left after the pinned header/footer, so
  // the keyboard just makes the scroll area shorter instead of hiding Save.
  scroll: { flexShrink: 1 },
  form: { gap: spacing.sm },
  section: { gap: spacing.xs },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  passageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  passageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    minHeight: TOUCH_TARGET,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
  },
  contentInput: { minHeight: 110, textAlignVertical: "top" },
  charCount: { textAlign: "right", marginTop: -spacing.sm },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  footer: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
