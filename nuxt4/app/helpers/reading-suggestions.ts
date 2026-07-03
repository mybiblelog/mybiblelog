// The reading-suggestion algorithm lives in @mybiblelog/shared so the web and
// mobile apps share one implementation. Re-exported here to preserve the
// historical import path for pages/stores/tests.
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
  type ReadingSuggestionPassage,
} from '@mybiblelog/shared';
