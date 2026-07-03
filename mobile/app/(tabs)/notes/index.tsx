import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import type { PassageNote } from "@/src/api/notesApi";
import {
  AnimatedList,
  Button,
  EmptyState,
  ErrorState,
  NoteCard,
  Screen,
  Spinner,
  Text,
  useNoteOverlays,
} from "@/src/components";
import { spacing, useTheme } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import {
  notesActions,
  useNotesHasAppliedOptions,
  useNotesState,
  useNotesStore,
} from "@/src/stores/passageNotes";
import { tagActions } from "@/src/stores/passageNoteTags";

const Separator = () => <View style={styles.separator} />;

export default function Notes() {
  const t = useT();
  const { colors } = useTheme();
  const state = useNotesState();
  const hasAppliedOptions = useNotesHasAppliedOptions();
  const { openAdd, openMenu, openQuery, overlays } = useNoteOverlays();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (useNotesStore.getState().state.status === "idle") {
      void notesActions.loadFirstPage();
    }
    void tagActions.loadTags();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void Promise.all([notesActions.loadFirstPage(), tagActions.loadTags()]).finally(() =>
      setRefreshing(false)
    );
  }, []);

  const header = (
    <View style={styles.header}>
      <Text variant="title" style={styles.headerTitle}>
        {t("notes_title")}
      </Text>
      <Button
        label={t("tags_title")}
        variant="secondary"
        onPress={() => router.push("/(tabs)/notes/tags")}
      />
      <Button label={t("notes_new")} leftIcon="add" onPress={openAdd} />
    </View>
  );

  const queryBar = (
    <View style={styles.queryBar}>
      <View style={styles.queryButtonWrap}>
        <Button
          label={t("query_open")}
          variant="secondary"
          size="sm"
          leftIcon="options-outline"
          onPress={openQuery}
        />
        {hasAppliedOptions ? (
          <View style={[styles.appliedDot, { backgroundColor: colors.primary }]} />
        ) : null}
      </View>
      {hasAppliedOptions ? (
        <Button
          label={t("query_reset")}
          variant="ghost"
          size="sm"
          onPress={() => void notesActions.resetQuery()}
        />
      ) : null}
    </View>
  );

  if (state.status === "idle" || state.status === "loading") {
    return (
      <Screen padded>
        {header}
        {queryBar}
        <View style={styles.loadingContainer}>
          <Spinner />
          <Text variant="body" color="mutedText">
            {t("notes_loading")}
          </Text>
        </View>
        {overlays}
      </Screen>
    );
  }

  if (state.status === "error") {
    return (
      <Screen padded>
        {header}
        {queryBar}
        <ErrorState
          title={t("notes_error_title")}
          text={state.message}
          retryLabel={t("retry")}
          onRetry={() => void notesActions.loadFirstPage()}
        />
        {overlays}
      </Screen>
    );
  }

  const { notes, totalSize, isFetchingMore } = state;

  return (
    <Screen padded>
      {header}
      {queryBar}

      <Text variant="caption" color="mutedText" style={styles.summary}>
        {t("notes_showing_count", { count: String(notes.length), total: String(totalSize) })}
      </Text>

      <AnimatedList
        data={notes}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[styles.listContent, notes.length === 0 && styles.listContentEmpty]}
        keyExtractor={(item: PassageNote) => item.id}
        renderItem={({ item }) => <NoteCard note={item} onPressMenu={openMenu} />}
        ItemSeparatorComponent={Separator}
        onEndReachedThreshold={0.4}
        onEndReached={() => void notesActions.loadMore()}
        ListFooterComponent={isFetchingMore ? <Spinner style={styles.footerSpinner} /> : null}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={t("notes_empty_title")}
            text={t("notes_empty_text")}
            ctaLabel={t("notes_new")}
            onPressCta={openAdd}
          />
        }
      />

      {overlays}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: { flex: 1 },
  queryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  queryButtonWrap: { position: "relative" },
  appliedDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  summary: { marginBottom: spacing.sm },
  listContent: { paddingBottom: spacing.listBottom },
  listContentEmpty: { flexGrow: 1 },
  separator: { height: spacing.md },
  footerSpinner: { marginVertical: spacing.lg },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.screenH,
  },
});
