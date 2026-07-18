// Main exports
export { default as Bible } from './bible';
export { default as BrowserCache } from './platform/browser-cache';

// Utility exports
export * from './bible/apps';
export * from './platform/device';
export * from './platform/date-helpers';
export { computeDateVerseCounts, type DateVerseCounts, type DateVerseCountsMap, type DateVerseCountLogEntry } from './insights/date-verse-counts';
export {
  filterEntriesByDateRange,
  getIntensityLevel,
  buildContributionCalendar,
  computeBookLastRead,
  getRecencyLevel,
  computeBookRecency,
  computeBookFrequencies,
  computeDailyVerseSeries,
  type InsightsLogEntry,
  type HeatmapCell,
  type HeatmapWeek,
  type ContributionCalendar,
  type BookLastRead,
  type BookRecency,
  type BookFrequency,
  type DailyVersePoint,
} from './insights/insights';

// Framework-agnostic UI/domain logic (consumable from a React hook, a Pinia
// store, or a plain component).
export {
  getBookOptions,
  filterAndSortBookOptions,
  type BookOption,
  type Testament,
  type BookSortOrder,
  type FilterAndSortBookOptions,
} from './bible/options';
export {
  parseVerseInput,
  coerceVerseRange,
  formatVerseRange,
  type ParseVerseInputOptions,
  type ParsedVerseInput,
} from './log-entry/verse-input';
export {
  buildMonthGrid,
  type MonthGridDay,
  type BuildMonthGridInput,
} from './insights/calendar';
export {
  buildLineChartGeometry,
  DEFAULT_CHART_DIMENSIONS,
  type ChartSeriesPoint,
  type ChartDimensions,
  type ChartPoint,
  type ChartYTick,
  type LineChartGeometry,
} from './insights/charts';
export {
  getBookIndexFromVerseId,
  isBookComplete,
  isBibleComplete,
  evaluateAchievement,
  type CompletionLogEntry,
  type AchievementEvent,
} from './log-entry/rules';
export {
  computeBibleProgress,
  type BibleProgress,
  type BookProgress,
  type ChapterProgress,
} from './bible/progress';
export {
  withSegmentPercentages,
  type SegmentWithPercentage,
} from './bible/segment-view';
export {
  TagSortOrders,
  compareByLabelAsc,
  getObjectIdCreatedMsOrNull,
  getTagCreatedMsOrNull,
  normalizeHexColor,
  hexToRgb,
  rgbToHue,
  makeTagComparator,
  normalizeSortOrder,
  sortPassageNoteTags,
  type PassageNoteTag,
  type PassageNoteTagSortOrder,
} from './passage-note-tags/sort';
export {
  getRecentDates,
  getLastLogEntryPerBook,
  filterSuggestionsOverlappingPassages,
  filterRangesByPassage,
  cropRangesByPassage,
  passageIsRead,
  getBookChapterRanges,
  getBookSuggestions,
  getReadingPathSuggestions,
  getReadingSuggestions,
  readingPathNT,
  readingPathOT,
  readingPathWisdom,
  type ReadingSuggestionPassage,
  type ReadingSuggestionLogEntry,
  type ReadingSuggestionContext,
  type ReadingSuggestion,
} from './insights/reading-suggestions';
export {
  fetchLogEntries,
  postLogEntry,
  patchLogEntry,
  deleteLogEntryRequest,
  type LogEntry,
  type CreateLogEntryInput,
  type UpdateLogEntryInput,
} from './log-entry/api';
export type { HttpClient, ApiResponse } from './platform/http-client';
export { identityTranslator, type Translator } from './platform/translator';

// The passage and editor state machines share transition names (selectBook,
// etc.), so they are exposed as namespaces rather than flattened.
export * as PassageSelection from './log-entry/passage-selection';
export * as LogEntryEditorMachine from './log-entry/editor-machine';
export type { LogEntryEditorModel } from './log-entry/editor-machine';
export type {
  PassageSelectionState,
  PassageSelectionOptions,
  PassageSelectionResult,
  SingleVerseSelection,
  SingleSelectionStep,
  SingleSelectionResult,
} from './log-entry/passage-selection';

// i18n exports
export * from './platform/i18n';

// Scripture passage types (provider-neutral)
export type {
  PassageBlock,
  PassageCursor,
  PassageTranslation,
  PassageVerseSegment,
  ScripturePassageChunk,
} from './bible/scripture';

// Static data exports
export { default as bibleBooks } from './bible/static/bible-books';
export { default as chapterVerses } from './bible/static/chapter-verses/nasb';

// Type exports
export type { BibleBook } from './bible/static/bible-books';
export type { ParsedVerseId, Segment, VerseId, VerseRange } from './bible';
