import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Bible } from "@mybiblelog/shared";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { useLogEntries } from "@/src/log-entries/LogEntriesProvider";
import {
  AnimatedList,
  Card,
  Screen,
  SegmentBar,
  type SegmentBarSegment,
  Spinner,
  Text,
} from "@/src/components";
import { radius, spacing, useTheme } from "@/src/design";
import { useUserSettings } from "@/src/settings/UserSettingsProvider";

// Brand gold for a fully-read book star — intentionally outside the theme
// palette (a single decorative accent).
const GOLD_STAR = "#ffd700";

type BookRow = {
  bookIndex: number;
  bookName: string;
  percentage: number;
  complete: boolean;
  segments: SegmentBarSegment[];
};

function calcPercent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.floor((numerator / denominator) * 100);
}

export default function BibleIndex() {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const { state: logState } = useLogEntries();
  const { state: settingsState } = useUserSettings();

  const lookBackDate =
    settingsState.status === "ready" ? settingsState.settings.lookBackDate : "0000-00-00";

  const currentLogEntries = useMemo(() => {
    if (logState.status !== "ready") return [];
    return logState.entries.filter((e) => e.date >= lookBackDate);
  }, [logState, lookBackDate]);

  const biblePlaque = useMemo(() => {
    const totalBibleVerses = Bible.getTotalVerseCount();
    const totalRead = Bible.countUniqueRangeVerses(currentLogEntries);
    const percentage = calcPercent(totalRead, totalBibleVerses);

    const segmentsRaw = Bible.generateBibleSegments(currentLogEntries);
    const segments: SegmentBarSegment[] = segmentsRaw.map((s, idx) => ({
      id: `${idx}-${s.startVerseId}-${s.endVerseId}`,
      read: !!s.read,
      verseCount: s.verseCount,
    }));

    return { percentage, segments };
  }, [currentLogEntries]);

  const books = useMemo<BookRow[]>(() => {
    const rows: BookRow[] = [];
    for (let bookIndex = 1, l = Bible.getBookCount(); bookIndex <= l; bookIndex++) {
      const bookName = Bible.getBookName(bookIndex, locale);
      const totalVerses = Bible.getBookVerseCount(bookIndex);
      const versesRead = Bible.countUniqueBookRangeVerses(bookIndex, currentLogEntries);
      const percentage = calcPercent(versesRead, totalVerses);
      const complete = percentage === 100;

      const segmentsRaw = Bible.generateBookSegments(bookIndex, currentLogEntries);
      const segments: SegmentBarSegment[] = segmentsRaw.map((s, idx) => ({
        id: `${bookIndex}-${idx}-${s.startVerseId}-${s.endVerseId}`,
        read: !!s.read,
        verseCount: s.verseCount,
      }));

      rows.push({ bookIndex, bookName, percentage, complete, segments });
    }
    return rows;
  }, [currentLogEntries, locale]);

  if (logState.status !== "ready" || settingsState.status !== "ready") {
    return (
      <Screen edges={[]}>
        <Spinner center />
      </Screen>
    );
  }

  return (
    <Screen edges={[]}>
      <Card style={styles.plaque}>
        <Text variant="label" style={styles.plaquePercent}>
          {biblePlaque.percentage}%
        </Text>
        <SegmentBar segments={biblePlaque.segments} thick />
      </Card>

      <AnimatedList
        data={books}
        keyExtractor={(item) => String(item.bookIndex)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.surfaceAlt },
              pressed && styles.pressed,
            ]}
            onPress={() => router.push(`/bible/${item.bookIndex}`)}
          >
            <View style={styles.cardTopRow}>
              <Ionicons
                name="star"
                size={18}
                color={item.complete ? GOLD_STAR : colors.border}
                style={styles.star}
              />
              <Text variant="bodyStrong" style={styles.bookName} numberOfLines={1}>
                {item.bookName}
              </Text>
              <Text variant="caption" color="mutedText" style={styles.percent}>
                {item.percentage}%
              </Text>
            </View>
            <SegmentBar segments={item.segments} />
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  plaque: {
    margin: spacing.screenH,
  },
  plaquePercent: {
    textAlign: "right",
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.screenH,
    paddingBottom: spacing.listBottom,
  },
  separator: { height: spacing.md },
  pressed: { opacity: 0.7 },
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  star: {
    width: 20,
  },
  bookName: {
    flex: 1,
  },
  percent: {
    width: 48,
    textAlign: "right",
  },
});
