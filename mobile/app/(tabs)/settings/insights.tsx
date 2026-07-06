import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import {
  ActivityHeatmap,
  BookFrequencyChart,
  BookRecencyList,
  DailyVersesChart,
  Screen,
  SegmentedControl,
  Text,
} from "@/src/components";
import { spacing } from "@/src/design";
import { useT } from "@/src/i18n/LocaleProvider";
import { useLogEntryList } from "@/src/stores/logEntries";

type InsightsView = "activity" | "books" | "frequency" | "trend";

export default function Insights() {
  const t = useT();
  const entries = useLogEntryList();
  const [view, setView] = useState<InsightsView>("activity");

  return (
    <Screen edges={[]}>
      <ScrollView contentContainerStyle={styles.content}>
        <SegmentedControl
          options={[
            { value: "activity", label: t("insights_tab_activity") },
            { value: "books", label: t("insights_tab_books") },
            { value: "frequency", label: t("insights_tab_frequency") },
            { value: "trend", label: t("insights_tab_trend") },
          ]}
          value={view}
          onChange={setView}
        />

        {entries === null ? (
          <Text variant="body" color="mutedText">
            {t("insights_loading")}
          </Text>
        ) : (
          <>
            {view === "activity" && (
              <>
                <Text variant="caption" color="mutedText">
                  {t("insights_description_activity")}
                </Text>
                <ActivityHeatmap entries={entries} />
              </>
            )}
            {view === "books" && (
              <>
                <Text variant="caption" color="mutedText">
                  {t("insights_description_books")}
                </Text>
                <BookRecencyList entries={entries} />
              </>
            )}
            {view === "frequency" && (
              <>
                <Text variant="caption" color="mutedText">
                  {t("insights_description_frequency")}
                </Text>
                <BookFrequencyChart entries={entries} />
              </>
            )}
            {view === "trend" && (
              <>
                <Text variant="caption" color="mutedText">
                  {t("insights_description_trend")}
                </Text>
                <DailyVersesChart entries={entries} />
              </>
            )}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.screenH,
    paddingBottom: spacing.listBottom,
    gap: spacing.lg,
  },
});
