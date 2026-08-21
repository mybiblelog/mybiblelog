import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { useIsAuthenticated } from "@/src/stores/auth";
import { useTagsList } from "@/src/stores/passageNoteTags";
import { Button } from "../atoms/Button";
import { TagPill } from "../atoms/TagPill";
import { Text } from "../atoms/Text";
import { CheckboxRow } from "../molecules/CheckboxRow";
import { BottomSheet } from "./BottomSheet";
import { TagCreationNotice, useCanCreateTags } from "./TagCreationGate";
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
 *
 * Tags are online-only (no offline mutation queue, unlike notes and log
 * entries), so creation is withdrawn rather than offered-then-failed whenever
 * the server is out of reach. Note editing itself stays available — the note
 * still queues locally — which is what the offline copy tells the user.
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
  const isAuthenticated = useIsAuthenticated();
  const canCreateTag = useCanCreateTags();
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
            {/* An empty list here is not an empty account — saying "create
                your first tag" would send the user at an action that can't
                succeed, so name the real reason and reassure them the note
                itself is still safe. */}
            {canCreateTag
              ? t("tag_no_tags")
              : isAuthenticated
                ? t("tag_unavailable_offline")
                : t("tag_unavailable_signed_out")}
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

        {/* When the list is empty the copy above already carries the reason;
            this is for the case where there are tags to pick but none to add. */}
        {allowCreate && tags.length > 0 ? (
          <TagCreationNotice testID="tag-selector.blocked-notice" />
        ) : null}

        <View style={styles.footer}>
          {allowCreate && canCreateTag ? (
            <Button
              label={t("tag_create")}
              testID="tag-selector.create"
              variant="secondary"
              leftIcon="add"
              onPress={() => setCreating(true)}
            />
          ) : (
            // Keeps Cancel right-aligned when there's no Create button.
            <View />
          )}
          <Button label={t("cancel")} variant="secondary" onPress={onClose} />
        </View>
      </BottomSheet>

      {allowCreate && canCreateTag ? (
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
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: { flex: 1 },
  list: { maxHeight: 360, flexShrink: 1 },
  empty: { paddingVertical: spacing.md },
  footer: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
});
