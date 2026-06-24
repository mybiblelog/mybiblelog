import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Bible } from "@mybiblelog/shared";
import { Screen } from "@/src/components/Screen";
import { typography } from "@/src/theme/tokens";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useLogEntries } from "@/src/log-entries/LogEntriesProvider";
import { useTheme } from "@/src/theme/ThemeProvider";
import { useToast } from "@/src/toast/ToastProvider";

const CHECKLIST_CACHE_KEY = "chapterChecklist.v1";
const CHECKLIST_CACHE_MAX_AGE_MS = 60 * 60 * 1000;

type ChapterReport = {
  bookIndex: number;
  chapterIndex: number;
  complete: boolean;
};

type BookReport = {
  bookIndex: number;
  bookName: string;
  totalChapters: number;
  chaptersRead: number;
  percentage: number;
  complete: boolean;
  chapterReports: ChapterReport[];
};

function calcPercent(numerator: number, denominator: number): number {
  if (!denominator) return 0;
  return Math.floor((numerator / denominator) * 100);
}

function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function initExpandedBooks(): Record<string, boolean> {
  const expanded: Record<string, boolean> = {};
  const bookCount = Bible.getBookCount();
  for (let i = 1; i <= bookCount; i++) expanded[String(i)] = false;
  return expanded;
}

export default function Checklist() {
  const t = useT();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { state: logState, createEntry, deleteEntry } = useLogEntries();

  const [computeBusy, setComputeBusy] = useState(false);
  const [busyChapter, setBusyChapter] = useState<string | null>(null);
  const [expandedBooks, setExpandedBooks] = useState<Record<string, boolean>>(
    () => initExpandedBooks()
  );
  const [readChapters, setReadChapters] = useState<Record<string, boolean>>(
    {}
  );
  const [bookReports, setBookReports] = useState<BookReport[]>([]);

  const computeTokenRef = useRef(0);

  const logEntries = useMemo(() => {
    if (logState.status !== "ready") return [];
    return logState.entries;
  }, [logState]);

  const busy = Boolean(computeBusy || busyChapter);

  const loadCachedReports = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(CHECKLIST_CACHE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return;
      const v = parsed as { ts?: unknown; data?: unknown };
      if (typeof v.ts !== "number") return;
      if (!Array.isArray(v.data)) return;
      if (Date.now() - v.ts > CHECKLIST_CACHE_MAX_AGE_MS) return;
      setBookReports(v.data as BookReport[]);
    } catch {
      // ignore cache issues
    }
  }, []);

  const computeReadChapters = useCallback(async () => {
    const ranges = Bible.consolidateRanges(logEntries);
    const nextRead: Record<string, boolean> = {};
    const markRead = (bookIndex: number, chapterIndex: number) => {
      nextRead[`${bookIndex}.${chapterIndex}`] = true;
    };

    for (const range of ranges) {
      const { book, chapter: startChapter, verse: startVerse } =
        Bible.parseVerseId(range.startVerseId);
      const { chapter: endChapter, verse: endVerse } = Bible.parseVerseId(
        range.endVerseId
      );

      if (startVerse === 1) {
        if (
          endChapter > startChapter ||
          Bible.getChapterVerseCount(book, startChapter) === endVerse
        ) {
          markRead(book, startChapter);
        }
      }
      if (
        endChapter > startChapter &&
        Bible.getChapterVerseCount(book, endChapter) === endVerse
      ) {
        markRead(book, endChapter);
      }
      if (endChapter > startChapter + 1) {
        for (let c = startChapter + 1; c < endChapter; c++) {
          markRead(book, c);
        }
      }

      await yieldToUI();
    }

    return nextRead;
  }, [logEntries]);

  const computeBookReports = useCallback(
    async (token: number) => {
      if (logState.status !== "ready") return;
      setComputeBusy(true);

      // Give a quick visual response while we compute.
      void loadCachedReports();

      const nextRead = await computeReadChapters();
      if (computeTokenRef.current !== token) return;
      setReadChapters(nextRead);

      const reports: BookReport[] = [];
      for (let bookIndex = 1, l = Bible.getBookCount(); bookIndex <= l; bookIndex++) {
        const bookName = Bible.getBookName(bookIndex, locale);
        const totalChapters = Bible.getBookChapterCount(bookIndex);
        const chapterReports: ChapterReport[] = [];
        let chaptersRead = 0;

        for (let chapterIndex = 1; chapterIndex <= totalChapters; chapterIndex++) {
          const complete = nextRead[`${bookIndex}.${chapterIndex}`] === true;
          if (complete) chaptersRead++;
          chapterReports.push({ bookIndex, chapterIndex, complete });
        }

        const percentage = calcPercent(chaptersRead, totalChapters);
        reports.push({
          bookIndex,
          bookName,
          totalChapters,
          chaptersRead,
          percentage,
          complete: percentage === 100,
          chapterReports,
        });

        await yieldToUI();
        if (computeTokenRef.current !== token) return;
      }

      setBookReports(reports);
      setComputeBusy(false);

      try {
        await AsyncStorage.setItem(
          CHECKLIST_CACHE_KEY,
          JSON.stringify({ ts: Date.now(), data: reports })
        );
      } catch {
        // ignore cache write issues
      }
    },
    [computeReadChapters, locale, loadCachedReports, logState.status]
  );

  useEffect(() => {
    // Preload cache so first paint has something to show.
    void loadCachedReports();
  }, [loadCachedReports]);

  useEffect(() => {
    computeTokenRef.current += 1;
    const token = computeTokenRef.current;
    void computeBookReports(token);
  }, [computeBookReports, locale, logEntries.length]);

  function toggleBook(bookIndex: number) {
    setExpandedBooks((prev) => ({
      ...prev,
      [String(bookIndex)]: !prev[String(bookIndex)],
    }));
  }

  async function toggleChapter(bookIndex: number, chapterIndex: number) {
    if (busyChapter) return;
    if (logState.status !== "ready") return;

    const key = `${bookIndex}.${chapterIndex}`;
    setBusyChapter(key);

    const date = dayjs().format("YYYY-MM-DD");
    const startVerseId = Bible.makeVerseId(bookIndex, chapterIndex, 1);
    const endVerseId = Bible.makeVerseId(
      bookIndex,
      chapterIndex,
      Bible.getChapterVerseCount(bookIndex, chapterIndex)
    );

    const isComplete = readChapters[key] === true;
    try {
      if (isComplete) {
        const matching = logEntries.find(
          (e) =>
            e.date === date &&
            e.startVerseId === startVerseId &&
            e.endVerseId === endVerseId
        );

        if (matching?.clientId) {
          await deleteEntry(matching.clientId);
        } else {
          showToast({ type: "info", message: t("logged_before_today") });
        }
      } else {
        await createEntry({ date, startVerseId, endVerseId });
      }
    } catch {
      showToast({
        type: "error",
        message: t(isComplete ? "unable_to_mark_incomplete" : "unable_to_mark_complete"),
      });
    } finally {
      setBusyChapter(null);
    }
  }

  const completeColor = colors.success;

  return (
    <Screen padded>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t("chapter_checklist")}</Text>
        {busy && <ActivityIndicator color={colors.primary} />}
      </View>

      {bookReports.length === 0 ? (
        <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.loadingText, { color: colors.mutedText }]}>
            {t("loading")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookReports}
          keyExtractor={(b) => String(b.bookIndex)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isExpanded = expandedBooks[String(item.bookIndex)] === true;
            return (
              <View
                style={[
                  styles.bookCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Pressable
                  onPress={() => toggleBook(item.bookIndex)}
                  style={styles.bookHeader}
                >
                  <View style={styles.bookHeaderLeft}>
                    <Ionicons
                      name={item.complete ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={item.complete ? completeColor : colors.border}
                      style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.bookName, { color: colors.text }]}>
                      {item.bookName}
                    </Text>
                  </View>

                  <View style={styles.bookHeaderRight}>
                    <Text style={[styles.bookFraction, { color: colors.mutedText }]}>
                      {item.chaptersRead} / {item.totalChapters}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color={colors.mutedText}
                      style={isExpanded && { transform: [{ rotate: "180deg" }] }}
                    />
                  </View>
                </Pressable>

                <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${item.percentage}%`, backgroundColor: completeColor },
                    ]}
                  />
                </View>

                {isExpanded && (
                  <View style={styles.chaptersWrap}>
                    {item.chapterReports.map((c) => {
                      const chapterKey = `${c.bookIndex}.${c.chapterIndex}`;
                      const isBusy = busyChapter === chapterKey;
                      const isCompleteChapter = c.complete;
                      return (
                        <Pressable
                          key={chapterKey}
                          onPress={() => void toggleChapter(c.bookIndex, c.chapterIndex)}
                          style={[
                            styles.chapterCard,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                          ]}
                        >
                          <Text style={[styles.chapterNumber, { color: colors.text }]}>
                            {c.chapterIndex}
                          </Text>
                          <View style={styles.chapterIndicator}>
                            {isBusy ? (
                              <ActivityIndicator
                                size="small"
                                color={isCompleteChapter ? colors.mutedText : completeColor}
                              />
                            ) : (
                              <Ionicons
                                name={isCompleteChapter ? "checkmark-circle" : "ellipse-outline"}
                                size={18}
                                color={isCompleteChapter ? completeColor : colors.border}
                              />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    ...typography.screenTitle,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingCard: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(0,0,0,0.10)",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "800",
  },
  bookCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  bookHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    paddingRight: 10,
  },
  bookHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookName: {
    fontSize: 15,
    fontWeight: "900",
    flexShrink: 1,
  },
  bookFraction: {
    fontSize: 13,
    fontWeight: "800",
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  chaptersWrap: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chapterCard: {
    width: 54,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumber: {
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 6,
  },
  chapterIndicator: {
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

