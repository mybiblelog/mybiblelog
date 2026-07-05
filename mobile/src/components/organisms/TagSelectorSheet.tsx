import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { useTagsList } from "@/src/stores/passageNoteTags";
import { Button } from "../atoms/Button";
import { TagPill } from "../atoms/TagPill";
import { Text } from "../atoms/Text";
import { CheckboxRow } from "../molecules/CheckboxRow";
import { BottomSheet } from "./BottomSheet";
import { TagEditorSheet } from "./TagEditorSheet";

type Props = {
  visible: boolean;
  selectedTagIds: string[];
  /** Show the "Create Tag" button (note editor: yes; query filter: no). */
  allowCreate?: boolean;
  onDone: (tagIds: string[]) => void;
  onClose: () => void;
};

/**
 * Multi-select tag chooser (web `PassageNoteManageTagsModal` equivalent).
 * With `allowCreate`, stacks a `TagEditorSheet` on top and auto-selects the
 * newly created tag — the sheets are sibling Modals, same stacking mechanism
 * as the log-entry editor's select sheets.
 */
export function TagSelectorSheet({
  visible,
  selectedTagIds,
  allowCreate = false,
  onDone,
  onClose,
}: Props) {
  const t = useT();
  const tags = useTagsList();
  const wasVisible = useRef(false);

  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setDraftIds(selectedTagIds);
      setCreating(false);
    }
    wasVisible.current = visible;
  }, [visible, selectedTagIds]);

  function toggle(tagId: string) {
    setDraftIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }

  function handleDone() {
    onDone(draftIds);
    onClose();
  }

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose}>
        <View style={styles.header}>
          <Text variant="heading" style={styles.headerTitle}>
            {t("note_manage_tags")}
          </Text>
          <Button label={t("done")} size="sm" onPress={handleDone} />
        </View>

        {tags.length === 0 ? (
          <Text variant="body" color="mutedText" style={styles.empty}>
            {t("tag_no_tags")}
          </Text>
        ) : (
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {tags.map((tag) => (
              <CheckboxRow
                key={tag.id}
                label={tag.label}
                checked={draftIds.includes(tag.id)}
                onToggle={() => toggle(tag.id)}
              >
                <TagPill label={tag.label} color={tag.color} />
              </CheckboxRow>
            ))}
          </ScrollView>
        )}

        <View style={styles.footer}>
          {allowCreate ? (
            <Button
              label={t("tag_create")}
              variant="secondary"
              leftIcon="add"
              onPress={() => setCreating(true)}
            />
          ) : (
            <View />
          )}
          <Button label={t("cancel")} variant="secondary" onPress={onClose} />
        </View>
      </BottomSheet>

      {allowCreate ? (
        <TagEditorSheet
          visible={creating}
          onClose={() => setCreating(false)}
          onSaved={(tag) => {
            // Auto-select the tag the user just created.
            setDraftIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
          }}
        />
      ) : null}
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
  list: { maxHeight: 360 },
  empty: { paddingVertical: spacing.xl },
  footer: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
});
