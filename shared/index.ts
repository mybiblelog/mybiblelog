// Main exports
export { default as Bible } from './bible/index.js';
export { default as BrowserCache } from './platform/browser-cache.js';

// Utility exports
export * from './text/linkify.js';
export * from './bible/apps.js';
export * from './bible/translations.js';
export * from './platform/device.js';
export * from './platform/date-helpers.js';
export { computeDateVerseCounts, type DateVerseCounts, type DateVerseCountsMap, type DateVerseCountLogEntry } from './insights/date-verse-counts.js';
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
} from './insights/insights.js';

// Framework-agnostic UI/domain logic (consumable from a React hook, a Pinia
// store, or a plain component).
export {
  getAllBookOptions,
  getBookOptions,
  filterAndSortBookOptions,
  type BookOption,
  type Testament,
  type TestamentFilter,
  type BookSortOrder,
  type FilterAndSortBookOptions,
} from './bible/options.js';
export {
  parseVerseInput,
  coerceVerseRange,
  formatVerseRange,
  type ParseVerseInputOptions,
  type ParsedVerseInput,
} from './log-entry/verse-input.js';
export {
  buildMonthGrid,
  type MonthGridDay,
  type BuildMonthGridInput,
} from './insights/calendar.js';
export {
  buildLineChartGeometry,
  buildMultiLineChartGeometry,
  DEFAULT_CHART_DIMENSIONS,
  type ChartSeriesPoint,
  type ChartDimensions,
  type ChartPoint,
  type ChartYTick,
  type LineChartGeometry,
  type NamedChartSeries,
  type MultiLineSeriesGeometry,
  type MultiLineChartGeometry,
} from './insights/charts.js';
export {
  getBookIndexFromVerseId,
  isBookComplete,
  isBibleComplete,
  evaluateAchievement,
  type CompletionLogEntry,
  type AchievementEvent,
} from './log-entry/rules.js';
export {
  computeBibleProgress,
  type BibleProgress,
  type BookProgress,
  type ChapterProgress,
} from './bible/progress.js';
export {
  withSegmentPercentages,
  type SegmentWithPercentage,
} from './bible/segment-view.js';
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
} from './passage-note-tags/sort.js';
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
} from './insights/reading-suggestions.js';
export {
  fetchLogEntries,
  postLogEntry,
  patchLogEntry,
  deleteLogEntryRequest,
  type LogEntry,
  type CreateLogEntryInput,
  type UpdateLogEntryInput,
} from './log-entry/api.js';
export type { HttpClient, ApiResponse } from './platform/http-client.js';
export { identityTranslator, type Translator } from './platform/translator.js';

// The passage and editor state machines share transition names (selectBook,
// etc.), so they are exposed as namespaces rather than flattened.
// Playwright's Babel loader can't parse `export * as X from`, so namespaces are
// imported then re-exported.
import * as PassageSelection from './log-entry/passage-selection.js';
import * as LogEntryEditorMachine from './log-entry/editor-machine.js';
export { PassageSelection, LogEntryEditorMachine };
export type { LogEntryEditorModel } from './log-entry/editor-machine.js';
export type {
  PassageSelectionState,
  PassageSelectionOptions,
  PassageSelectionResult,
  SingleVerseSelection,
  SingleSelectionStep,
  SingleSelectionResult,
} from './log-entry/passage-selection.js';

// i18n exports
export * from './platform/i18n.js';

// Scripture passage types (provider-neutral)
export type {
  PassageBlock,
  PassageCursor,
  PassageTranslation,
  PassageVerseSegment,
  ScripturePassageChunk,
} from './bible/scripture.js';

// Static data exports
export { default as bibleBooks } from './bible/static/bible-books.js';
export { default as chapterVerses } from './bible/static/chapter-verses/nasb.js';

// Type exports
export type { BibleBook } from './bible/static/bible-books.js';
export type { ParsedVerseId, Segment, VerseId, VerseRange } from './bible/index.js';
