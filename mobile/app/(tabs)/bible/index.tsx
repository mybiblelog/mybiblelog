import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Bible } from "@mybiblelog/shared";
import { useLocale } from "@/src/i18n/LocaleProvider";
import { useLogEntries } from "@/src/log-entries/LogEntriesProvider";
import { SegmentBar, type SegmentBarSegment } from "@/src/components/SegmentBar";
import { useUserSettings } from "@/src/settings/UserSettingsProvider";
import { useTheme } from "@/src/theme/ThemeProvider";

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
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.plaque, { backgroundColor: colors.surfaceAlt }]}>
        <Text style={[styles.plaquePercent, { color: colors.text }]}>
          {biblePlaque.percentage}%
        </Text>
        <SegmentBar segments={biblePlaque.segments} thick />
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => String(item.bookIndex)}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { backgroundColor: colors.surfaceAlt }]}
            onPress={() => router.push(`/bible/${item.bookIndex}`)}
          >
            <View style={styles.cardTopRow}>
              <Ionicons
                name="star"
                size={18}
                color={item.complete ? "#ffd700" : colors.border}
                style={styles.star}
              />
              <Text style={[styles.bookName, { color: colors.text }]} numberOfLines={1}>
                {item.bookName}
              </Text>
              <Text style={[styles.percent, { color: colors.mutedText }]}>
                {item.percentage}%
              </Text>
            </View>
            <SegmentBar segments={item.segments} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  plaque: {
    margin: 16,
    padding: 14,
    borderRadius: 16,
  },
  plaquePercent: {
    textAlign: "right",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  star: {
    width: 20,
  },
  bookName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
  },
  percent: {
    width: 48,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "800",
  },
});

