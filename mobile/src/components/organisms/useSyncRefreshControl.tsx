import { type ReactElement, useCallback, useState } from "react";
import { RefreshControl, type RefreshControlProps } from "react-native";
import { useTheme } from "@/src/design";
import { logEntryActions } from "@/src/stores/logEntries";
import { userSettingsActions } from "@/src/stores/userSettings";

/**
 * Pull-to-refresh control wired to the offline-first sync: draining the
 * mutation queue, reconciling entries with the server, and refreshing
 * server-backed settings. Pass the returned element to a list's
 * `refreshControl` prop.
 */
export function useSyncRefreshControl(): ReactElement<RefreshControlProps> {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void (async () => {
      try {
        await Promise.all([
          logEntryActions.syncNow(),
          userSettingsActions.refreshFromServer(),
        ]);
      }
      finally {
        setRefreshing(false);
      }
    })();
  }, []);

  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
    />
  );
}
