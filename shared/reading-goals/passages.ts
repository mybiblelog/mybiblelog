import Bible from '../bible';

/**
 * A goal stores arbitrary verse ranges so chapter- or range-based goals can be
 * allowed later without a data migration. For now the API and UI only accept
 * whole books, each stored as a single passage spanning the entire book.
 */
export type GoalPassage = {
  startVerseId: number;
  endVerseId: number;
};

export const MAX_GOAL_PASSAGES = 66;

export type GoalPassageError =
  | 'empty'
  | 'too_many'
  | 'invalid_range'
  | 'overlap'
  | 'not_whole_book';

export const bookToPassage = (bookIndex: number): GoalPassage => ({
  startVerseId: Bible.getFirstBookVerseId(bookIndex),
  endVerseId: Bible.getLastBookVerseId(bookIndex),
});

export const passageBookIndex = (passage: GoalPassage): number =>
  Bible.parseVerseId(passage.startVerseId).book;

export const isWholeBookPassage = (passage: GoalPassage): boolean => {
  const bookIndex = passageBookIndex(passage);
  return (
    passage.startVerseId === Bible.getFirstBookVerseId(bookIndex) &&
    passage.endVerseId === Bible.getLastBookVerseId(bookIndex)
  );
};

/**
 * Returns every rule the passages break (empty when valid). `wholeBooksOnly`
 * is the temporary restriction; drop it once arbitrary passages are allowed.
 */
export const validateGoalPassages = (
  passages: ReadonlyArray<GoalPassage>,
  { wholeBooksOnly = true }: { wholeBooksOnly?: boolean } = {},
): GoalPassageError[] => {
  const errors = new Set<GoalPassageError>();
  if (passages.length === 0) {
    errors.add('empty');
  }
  if (passages.length > MAX_GOAL_PASSAGES) {
    errors.add('too_many');
  }
  for (const passage of passages) {
    if (!Bible.validateRange(passage.startVerseId, passage.endVerseId)) {
      errors.add('invalid_range');
    }
    else if (wholeBooksOnly && !isWholeBookPassage(passage)) {
      errors.add('not_whole_book');
    }
  }
  for (let i = 0; i < passages.length; i++) {
    for (let j = i + 1; j < passages.length; j++) {
      if (Bible.checkRangeOverlap(passages[i]!, passages[j]!)) {
        errors.add('overlap');
      }
    }
  }
  return [...errors];
};
