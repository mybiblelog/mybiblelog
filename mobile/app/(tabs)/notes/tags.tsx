import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { PassageNoteTag } from "@/src/api/tagsApi";
import {
  AnimatedList,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ListItem,
  MenuSheet,
  Screen,
  SelectSheet,
  Spinner,
  TagEditorSheet,
  TagPill,
  Text,
} from "@/src/components";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { TagSortOrders, type PassageNoteTagSortOrder } from "@/src/notes/tagSort";
import { notesActions } from "@/src/stores/passageNotes";
import { tagActions, useTagsSortOrder, useTagsState } from "@/src/stores/passageNoteTags";
import { useToast } from "@/src/toast/ToastProvider";

const Separator = () => <View style={styles.separator} />;

export default function Tags() {
  const t = useT();
  const { showToast } = useToast();
  const state = useTagsState();
  const sortOrder = useTagsSortOrder();

  const [sortOpen, setSortOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [menuTag, setMenuTag] = useState<PassageNoteTag | null>(null);
  const [editingTag, setEditingTag] = useState<PassageNoteTag | null>(null);
  const [deletingTag, setDeletingTag] = useState<PassageNoteTag | null>(null);
  const [blockedTag, setBlockedTag] = useState<PassageNoteTag | null>(null);

  useEffect(() => {
    void tagActions.loadTags();
  }, []);

  const sortOptions = useMemo(
    () =>
      TagSortOrders.map((order) => ({
        value: order,
        label: t(`tag_sort_${order.replace(":", "_")}` as Parameters<typeof t>[0]),
      })),
    [t]
  );

  function showNotes(tag: PassageNoteTag) {
    void notesActions.resetQuery({ filterTags: [tag.id] });
    router.back();
  }

  function requestDelete(tag: PassageNoteTag) {
    // Mirrors the web rule: a tag still in use cannot be deleted.
    if (tag.noteCount > 0) {
      setBlockedTag(tag);
      return;
    }
    setDeletingTag(tag);
  }

  const body = () => {
    if (state.status === "idle" || state.status === "loading") {
      return (
        <View style={styles.loadingContainer}>
          <Spinner />
          <Text variant="body" color="mutedText">
            {t("tags_loading")}
          </Text>
        </View>
      );
    }
    if (state.status === "error") {
      return (
        <ErrorState
          title={t("tags_error_title")}
          text={state.message}
          retryLabel={t("retry")}
          onRetry={() => void tagActions.loadTags()}
        />
      );
    }
    return (
      <AnimatedList
        data={state.tags}
        contentContainerStyle={[
          styles.listContent,
          state.tags.length === 0 && styles.listContentEmpty,
        ]}
        keyExtractor={(item: PassageNoteTag) => item.id}
        renderItem={({ item }) => (
          <ListItem
            title={item.label}
            leading={<TagPill label={item.label} color={item.color} />}
            subtitle={item.description || undefined}
            meta={t("tag_notes_count", { count: item.noteCount })}
            chevron
            onPress={() => setMenuTag(item)}
            style={styles.tagRow}
          />
        )}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon="pricetags-outline"
            title={t("tags_empty_title")}
            text={t("tags_empty_text")}
            ctaLabel={t("tag_create")}
            onPressCta={() => setCreating(true)}
          />
        }
      />
    );
  };

  return (
    <Screen padded edges={[]}>
      <View style={styles.toolbar}>
        <Button
          label={t("tag_sort_by")}
          variant="secondary"
          size="sm"
          leftIcon="swap-vertical-outline"
          onPress={() => setSortOpen(true)}
        />
        <Button
          label={t("tag_create")}
          size="sm"
          leftIcon="add"
          onPress={() => setCreating(true)}
        />
      </View>

      {body()}

      <SelectSheet
        visible={sortOpen}
        title={t("tag_sort_by")}
        options={sortOptions}
        selectedValue={sortOrder}
        onSelect={(order) => void tagActions.setSortOrder(order as PassageNoteTagSortOrder)}
        onClose={() => setSortOpen(false)}
      />

      <TagEditorSheet visible={creating} onClose={() => setCreating(false)} />
      <TagEditorSheet
        visible={editingTag !== null}
        initialTag={editingTag}
        onClose={() => setEditingTag(null)}
      />

      <MenuSheet
        visible={menuTag !== null}
        onClose={() => setMenuTag(null)}
        cancelLabel={t("cancel")}
        actions={[
          {
            label: t("tag_view_notes", { count: menuTag?.noteCount ?? 0 }),
            onPress: () => menuTag && showNotes(menuTag),
          },
          { label: t("edit"), onPress: () => setEditingTag(menuTag) },
          {
            label: t("delete"),
            color: "destructive",
            onPress: () => menuTag && requestDelete(menuTag),
          },
        ]}
      />

      <ConfirmDialog
        visible={deletingTag !== null}
        title={t("tag_delete_confirm_title")}
        message={t("tag_delete_confirm_message")}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        onCancel={() => setDeletingTag(null)}
        onConfirm={() => {
          const tag = deletingTag;
          setDeletingTag(null);
          if (!tag) return;
          void tagActions.remove(tag.id).then((deleted) => {
            if (!deleted) showToast({ type: "error", message: t("tag_not_deleted") });
          });
        }}
      />

      <ConfirmDialog
        visible={blockedTag !== null}
        title={t("tag_cannot_delete_title")}
        message={t("tag_cannot_delete_message")}
        confirmLabel={t("close")}
        cancelLabel={t("cancel")}
        destructive={false}
        onCancel={() => setBlockedTag(null)}
        onConfirm={() => setBlockedTag(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  tagRow: { alignItems: "flex-start" },
  listContent: { paddingBottom: spacing.listBottom },
  listContentEmpty: { flexGrow: 1 },
  separator: { height: spacing.md },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.screenH,
  },
});
