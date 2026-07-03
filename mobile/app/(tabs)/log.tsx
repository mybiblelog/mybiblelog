import { StyleSheet, View } from "react-native";
import {
  AnimatedList,
  Button,
  EmptyState,
  LogEntryRow,
  Screen,
  Spinner,
  Text,
  useLogEntryOverlays,
  useSyncRefreshControl,
} from "@/src/components";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import type { StoredLogEntry } from "@/src/storage/logEntries";
import { useLogEntryList } from "@/src/stores/logEntries";

const Separator = () => <View style={styles.separator} />;

export default function Log() {
  const t = useT();
  const entries = useLogEntryList();
  const refreshControl = useSyncRefreshControl();
  const { openAdd, openMenu, overlays } = useLogEntryOverlays({
    entries: entries ?? [],
  });

  if (entries === null) {
    return (
      <Screen>
        <View style={styles.loadingContainer}>
          <Spinner />
          <Text variant="body" color="mutedText">
            {t("loading_log_entries")}
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen padded>
      <View style={styles.header}>
        <Text variant="title">{t("log_title")}</Text>
        <Button label={t("add")} leftIcon="add" onPress={openAdd} />
      </View>

      <AnimatedList
        data={entries}
        refreshControl={refreshControl}
        contentContainerStyle={[
          styles.listContent,
          entries.length === 0 && styles.listContentEmpty,
        ]}
        keyExtractor={(item: StoredLogEntry) => item.clientId}
        renderItem={({ item }) => <LogEntryRow entry={item} onPressMenu={() => openMenu(item)} />}
        ItemSeparatorComponent={Separator}
        ListEmptyComponent={
          <EmptyState
            icon="list-outline"
            title={t("empty_title")}
            text={t("empty_text")}
            ctaLabel={t("empty_cta")}
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
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.listBottom,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  separator: {
    height: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.screenH,
  },
});
