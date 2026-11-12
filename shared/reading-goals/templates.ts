import Bible from '../bible';
import type { BibleBook } from '../bible/static/bible-books';
import { bookToPassage, type GoalPassage } from './passages';

export type ReadingGoalTemplateId =
  | 'whole_bible'
  | 'old_testament'
  | 'new_testament'
  | 'gospels'
  | 'wisdom';

export type ReadingGoalTemplate = {
  id: ReadingGoalTemplateId;
  includes: (book: BibleBook) => boolean;
};

const WISDOM_OF_SOLOMON = 71;
const SIRACH = 72;

const inRange = (first: number, last: number) => (book: BibleBook): boolean =>
  book.bibleOrder >= first && book.bibleOrder <= last;

/**
 * Pre-made goals offered at the start of goal creation. A template selects
 * books from the reader's canon, so deuterocanonical books join the matching
 * templates (in canonical order) only when the reader includes them. Goals
 * created from one store `passages` and keep no reference to the template.
 */
export const READING_GOAL_TEMPLATES: ReadonlyArray<ReadingGoalTemplate> = [
  { id: 'whole_bible', includes: () => true },
  { id: 'old_testament', includes: book => !book.newTestament },
  { id: 'new_testament', includes: book => book.newTestament },
  { id: 'gospels', includes: inRange(40, 43) },
  {
    id: 'wisdom',
    includes: book => inRange(18, 22)(book) || book.bibleOrder === WISDOM_OF_SOLOMON || book.bibleOrder === SIRACH,
  },
];

export const getReadingGoalTemplate = (id: string): ReadingGoalTemplate | undefined =>
  READING_GOAL_TEMPLATES.find(template => template.id === id);

export const getTemplateBookIndexes = (id: string, includeDeuterocanonical = false): number[] => {
  const template = getReadingGoalTemplate(id);
  if (!template) {
    return [];
  }
  return Bible.getBooksForCanon(includeDeuterocanonical)
    .filter(template.includes)
    .map(book => book.bibleOrder);
};

export const getTemplatePassages = (id: string, includeDeuterocanonical = false): GoalPassage[] =>
  getTemplateBookIndexes(id, includeDeuterocanonical).map(bookToPassage);
