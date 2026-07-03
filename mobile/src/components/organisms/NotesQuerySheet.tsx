import { Bible } from "@mybiblelog/shared";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { NotesQuery } from "@/src/api/notesApi";
import { spacing } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useTagsList } from "@/src/stores/passageNoteTags";
import { Button } from "../atoms/Button";
import { TagPill } from "../atoms/TagPill";
import { Text } from "../atoms/Text";
import { CheckboxRow } from "../molecules/CheckboxRow";
import { InputField } from "../molecules/InputField";
import { SegmentedControl } from "../molecules/SegmentedControl";
import { SelectRow } from "../molecules/SelectRow";
import { BottomSheet } from "./BottomSheet";
import { PassageRangeSheet } from "./PassageRangeSheet";
import { TagSelectorSheet } from "./TagSelectorSheet";

type Props = {
  visible: boolean;
  appliedQuery: NotesQuery;
  onApply: (update: Partial<NotesQuery>) => void;
  onClose: () => void;
};

type QueryDraft = Pick<
  NotesQuery,
  | "searchText"
  | "filterTags"
  | "filterTagMatching"
  | "filterPassageStartVerseId"
  | "filterPassageEndVerseId"
  | "filterPassageMatching"
  | "sortDirection"
  | "limit"
>;

const toDraft = (query: NotesQuery): QueryDraft => ({
  searchText: query.searchText,
  filterTags: [...query.filterTags],
  filterTagMatching: query.filterTagMatching,
  filterPassageStartVerseId: query.filterPassageStartVerseId,
  filterPassageEndVerseId: query.filterPassageEndVerseId,
  filterPassageMatching: query.filterPassageMatching,
  sortDirection: query.sortDirection,
  limit: query.limit,
});

/**
 * Search / filter / sort sheet (web `PassageNotesQueryManager` equivalent).
 * Edits a draft and applies it in one shot; "untagged only" is expressed as
 * `filterTagMatching: 'exact'` with no tags, exactly like the web.
 */
export function NotesQuerySheet({ visible, appliedQuery, onApply, onClose }: Props) {
  const t = useT();
  const { locale } = useLocale();
  const tags = useTagsList();
  const wasVisible = useRef(false);

  const [draft, setDraft] = useState<QueryDraft>(() => toDraft(appliedQuery));
  const [choosingTags, setChoosingTags] = useState(false);
  const [choosingPassage, setChoosingPassage] = useState(false);

  useEffect(() => {
    if (visible && !wasVisible.current) {
      setDraft(toDraft(appliedQuery));
      setChoosingTags(false);
      setChoosingPassage(false);
    }
    wasVisible.current = visible;
  }, [visible, appliedQuery]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(toDraft(appliedQuery));

  const hasPassageFilter = Boolean(
    draft.filterPassageStartVerseId && draft.filterPassageEndVerseId
  );
  const untaggedOnly = draft.filterTagMatching === "exact" && draft.filterTags.length === 0;

  const selectedTags = draft.filterTags
    .map((id) => tags.find((tag) => tag.id === id))
    .filter((tag): tag is NonNullable<typeof tag> => tag !== undefined);

  function handleApply() {
    onApply(draft);
    onClose();
  }

  return (
    <>
      <BottomSheet visible={visible} onClose={onClose} swipeToDismiss={false}>
        <View style={styles.header}>
          <Text variant="heading" style={styles.headerTitle}>
            {t("query_title")}
          </Text>
          <Button label={t("query_apply")} size="sm" onPress={handleApply} disabled={!isDirty} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
        >
          <InputField
            label={t("query_search_label")}
            value={draft.searchText}
            onChangeText={(searchText) => setDraft((prev) => ({ ...prev, searchText }))}
            placeholder={t("query_search_placeholder")}
            autoCapitalize="none"
            returnKeyType="search"
          />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="label" color="mutedText">
                {t("query_tag_filters")}
              </Text>
              <View style={styles.sectionActions}>
                {draft.filterTags.length > 0 ? (
                  <Button
                    label={t("query_clear_tags")}
                    size="sm"
                    variant="ghost"
                    onPress={() => setDraft((prev) => ({ ...prev, filterTags: [] }))}
                  />
                ) : null}
                <Button
                  label={t("query_choose_tags")}
                  size="sm"
                  variant="secondary"
                  onPress={() => setChoosingTags(true)}
                />
              </View>
            </View>

            {selectedTags.length > 0 ? (
              <View style={styles.pillRow}>
                {selectedTags.map((tag) => (
                  <TagPill key={tag.id} label={tag.label} color={tag.color} />
                ))}
              </View>
            ) : (
              <CheckboxRow
                label={t("query_only_untagged")}
                checked={untaggedOnly}
                onToggle={() =>
                  setDraft((prev) => ({
                    ...prev,
                    filterTagMatching: untaggedOnly ? "any" : "exact",
                    filterTags: [],
                  }))
                }
              />
            )}

            {draft.filterTags.length > 0 ? (
              <SegmentedControl
                label={t("query_tag_match")}
                options={[
                  { value: "any", label: t("query_tag_match_any") },
                  { value: "all", label: t("query_tag_match_all") },
                  { value: "exact", label: t("query_tag_match_exact") },
                ]}
                value={draft.filterTagMatching}
                onChange={(filterTagMatching) =>
                  setDraft((prev) => ({ ...prev, filterTagMatching }))
                }
              />
            ) : null}
          </View>

          <View style={styles.section}>
            <SelectRow
              label={t("query_passage")}
              value={
                hasPassageFilter
                  ? Bible.displayVerseRange(
                      draft.filterPassageStartVerseId,
                      draft.filterPassageEndVerseId,
                      locale
                    )
                  : null
              }
              placeholder={t("query_passage_choose")}
              onPress={() => setChoosingPassage(true)}
            />
            {hasPassageFilter ? (
              <>
                <Button
                  label={t("query_passage_clear")}
                  size="sm"
                  variant="ghost"
                  onPress={() =>
                    setDraft((prev) => ({
                      ...prev,
                      filterPassageStartVerseId: 0,
                      filterPassageEndVerseId: 0,
                    }))
                  }
                />
                <SegmentedControl
                  label={t("query_passage_match")}
                  options={[
                    { value: "inclusive", label: t("query_passage_match_inclusive") },
                    { value: "exclusive", label: t("query_passage_match_exclusive") },
                  ]}
                  value={draft.filterPassageMatching}
                  onChange={(filterPassageMatching) =>
                    setDraft((prev) => ({ ...prev, filterPassageMatching }))
                  }
                />
                <Text variant="caption" color="mutedText">
                  {draft.filterPassageMatching === "inclusive"
                    ? t("query_passage_match_inclusive_desc")
                    : t("query_passage_match_exclusive_desc")}
                </Text>
              </>
            ) : null}
          </View>

          <SegmentedControl
            label={t("query_sort")}
            options={[
              { value: "descending", label: t("query_sort_newest") },
              { value: "ascending", label: t("query_sort_oldest") },
            ]}
            value={draft.sortDirection}
            onChange={(sortDirection) => setDraft((prev) => ({ ...prev, sortDirection }))}
          />

          <SegmentedControl
            label={t("query_page_size")}
            options={[
              { value: 10, label: "10" },
              { value: 20, label: "20" },
              { value: 50, label: "50" },
            ]}
            value={draft.limit}
            onChange={(limit) => setDraft((prev) => ({ ...prev, limit }))}
          />
        </ScrollView>

        <View style={styles.footer}>
          <Button label={t("cancel")} variant="secondary" onPress={onClose} />
        </View>
      </BottomSheet>

      <TagSelectorSheet
        visible={choosingTags}
        selectedTagIds={draft.filterTags}
        onDone={(filterTags) =>
          setDraft((prev) => ({
            ...prev,
            filterTags,
            // Leaving "untagged only" (exact + none) armed while picking tags
            // would silently exact-match; fall back to "any" like the web.
            filterTagMatching:
              prev.filterTagMatching === "exact" &&
              prev.filterTags.length === 0 &&
              filterTags.length > 0
                ? "any"
                : prev.filterTagMatching,
          }))
        }
        onClose={() => setChoosingTags(false)}
      />

      <PassageRangeSheet
        visible={choosingPassage}
        title={t("query_passage")}
        initialRange={
          hasPassageFilter
            ? {
                startVerseId: draft.filterPassageStartVerseId,
                endVerseId: draft.filterPassageEndVerseId,
              }
            : null
        }
        onSubmit={(range) =>
          setDraft((prev) => ({
            ...prev,
            filterPassageStartVerseId: range.startVerseId,
            filterPassageEndVerseId: range.endVerseId,
          }))
        }
        onClose={() => setChoosingPassage(false)}
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
  scroll: { maxHeight: 480 },
  form: { gap: spacing.xl },
  section: { gap: spacing.sm },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  footer: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
