import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import type { PassageNote } from "@/src/api/notesApi";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { useIsUnauthenticated } from "@/src/stores/auth";
import { useConnectionStatus } from "@/src/stores/connectivity";
import { useLocalNotes } from "@/src/stores/offlineNotes";
import type { StoredLocalNote } from "@/src/storage/passageNotes";
import { Icon } from "../atoms/Icon";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { EmptyState } from "../molecules/EmptyState";
import { InlineAlert } from "../molecules/InlineAlert";
import { ScreenHeader } from "../molecules/ScreenHeader";
import { Screen } from "../layouts/Screen";
import { AnimatedList } from "./AnimatedList";
import { NoteCard } from "./NoteCard";
import { useLocalNoteOverlays } from "./LocalNoteOverlays";

/** Present a local note as a `PassageNote` for the shared card/editor (id = clientId). */
function toCardNote(note: StoredLocalNote): PassageNote {
  return {
    id: note.clientId,
    content: note.content,
    passages: note.passages,
    tags: note.tags,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

const Separator = () => <View style={styles.separator} />;

/**
 * The local-notes surface shown whenever the Notes tab can't reach the API
 * (offline or logged out). A simple create/edit/delete list of on-device notes
 * that sync once online + authenticated — no search/filter/sort. When logged out,
 * a dismissible sign-in banner explains how to sync and see all notes.
 */
export function OfflineNotesView() {
  const t = useT();
  const notes = useLocalNotes();
  const isUnauthenticated = useIsUnauthenticated();
  const status = useConnectionStatus();
  const canReachServer = status === "online" || status === "unknown";
  const { openAdd, openMenu, overlays } = useLocalNoteOverlays();

  const header = (
    <ScreenHeader
      title={t("notes_title")}
      style={styles.header}
      right={<Button label={t("notes_new")} testID="notes.new" leftIcon="add" onPress={openAdd} />}
    />
  );

  const banner = isUnauthenticated ? (
    <InlineAlert
      testID="notes.signin"
      icon="log-in-outline"
      title={t("notes_signin_title")}
      text={t("notes_signin_text")}
      ctaLabel={canReachServer ? t("auth_login") : undefined}
      ctaIcon="log-in-outline"
      onPressCta={canReachServer ? () => router.push("/login") : undefined}
      dismissLabel={t("dismiss")}
      dismissKey="notesSignInDismissed"
    >
      {canReachServer ? null : (
        <View style={styles.offlineNotice}>
          <Icon
            name={status === "device-offline" ? "cloud-offline-outline" : "alert-circle-outline"}
            size={16}
            color="mutedText"
          />
          <Text variant="caption" color="mutedText" style={styles.offlineNoticeText}>
            {t(
              status === "device-offline"
                ? "auth_login_requires_connection"
                : "auth_login_requires_server"
            )}
          </Text>
        </View>
      )}
    </InlineAlert>
  ) : null;

  return (
    <Screen padded>
      {header}
      {banner}

      <Text variant="caption" color="mutedText" style={styles.hint}>
        {t("notes_offline_hint")}
      </Text>

      <AnimatedList
        data={notes}
        animateItemLayout={false}
        contentContainerStyle={[styles.listContent, notes.length === 0 && styles.listContentEmpty]}
        keyExtractor={(item: StoredLocalNote) => item.clientId}
        renderItem={({ item }: { item: StoredLocalNote }) => (
          <NoteCard note={toCardNote(item)} onPressMenu={openMenu} />
        )}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon="document-text-outline"
            title={t("notes_offline_empty_title")}
            text={t("notes_offline_empty_text")}
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
  header: { marginBottom: spacing.sm },
  hint: { marginBottom: spacing.xs },
  listContent: { paddingBottom: spacing.listBottom },
  listContentEmpty: { flexGrow: 1 },
  separator: { height: spacing.sm },
  offlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  offlineNoticeText: { flex: 1 },
});
