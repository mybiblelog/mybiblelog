import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { Bible } from "@mybiblelog/shared";
import {
  AnimatedList,
  Card,
  Icon,
  ProgressBar,
  Screen,
  Spinner,
  Text,
} from "@/src/components";
import { fadeIn, radius, spacing, useTheme } from "@/src/design";
import { useLocale, useT } from "@/src/i18n/LocaleProvider";
import { useLogEntries } from "@/src/stores/logEntries";
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

  return (
    <Screen padded>
      <View style={styles.header}>
        <Text variant="title">{t("chapter_checklist")}</Text>
        {busy && <Spinner />}
      </View>

      {bookReports.length === 0 ? (
        <Card>
          <Text variant="bodyStrong" color="mutedText">
            {t("loading")}
          </Text>
        </Card>
      ) : (
        <AnimatedList
          data={bookReports}
          keyExtractor={(b) => String(b.bookIndex)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isExpanded = expandedBooks[String(item.bookIndex)] === true;
            return (
              <Card padded style={styles.bookCard}>
                <Pressable
                  onPress={() => toggleBook(item.bookIndex)}
                  style={({ pressed }) => [styles.bookHeader, pressed && styles.pressed]}
                >
                  <View style={styles.bookHeaderLeft}>
                    <Icon
                      name={item.complete ? "checkmark-circle" : "ellipse-outline"}
                      size={18}
                      color={item.complete ? "success" : "border"}
                    />
                    <Text variant="bodyStrong" style={styles.bookName}>
                      {item.bookName}
                    </Text>
                  </View>

                  <View style={styles.bookHeaderRight}>
                    <Text variant="caption" color="mutedText">
                      {item.chaptersRead} / {item.totalChapters}
                    </Text>
                    <View
                      style={isExpanded ? styles.chevronUp : undefined}
                    >
                      <Icon name="chevron-down" size={18} color="mutedText" />
                    </View>
                  </View>
                </Pressable>

                <ProgressBar
                  progress={item.percentage / 100}
                  height={8}
                  color="success"
                  trackColor="surfaceAlt"
                  style={styles.progress}
                />

                {isExpanded && (
                  <Animated.View entering={fadeIn()} style={styles.chaptersWrap}>
                    {item.chapterReports.map((c) => {
                      const chapterKey = `${c.bookIndex}.${c.chapterIndex}`;
                      const isBusy = busyChapter === chapterKey;
                      const isCompleteChapter = c.complete;
                      return (
                        <Pressable
                          key={chapterKey}
                          onPress={() => void toggleChapter(c.bookIndex, c.chapterIndex)}
                          style={({ pressed }) => [
                            styles.chapterCard,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text variant="bodyStrong" style={styles.chapterNumber}>
                            {c.chapterIndex}
                          </Text>
                          <View style={styles.chapterIndicator}>
                            {isBusy ? (
                              <Spinner
                                size="small"
                                color={isCompleteChapter ? "mutedText" : "success"}
                              />
                            ) : (
                              <Icon
                                name={isCompleteChapter ? "checkmark-circle" : "ellipse-outline"}
                                size={18}
                                color={isCompleteChapter ? "success" : "border"}
                              />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </Animated.View>
                )}
              </Card>
            );
          }}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingBottom: spacing.listBottom,
  },
  separator: { height: spacing.lg },
  pressed: { opacity: 0.7 },
  bookCard: {
    borderRadius: radius.lg,
  },
  bookHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
  },
  bookHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    paddingRight: spacing.md,
    gap: spacing.md,
  },
  bookHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bookName: {
    flexShrink: 1,
  },
  chevronUp: {
    transform: [{ rotate: "180deg" }],
  },
  progress: { marginTop: spacing.sm },
  chaptersWrap: {
    marginTop: spacing.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  chapterCard: {
    width: 54,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumber: {
    marginBottom: spacing.xs,
  },
  chapterIndicator: {
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});

