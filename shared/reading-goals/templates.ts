import { bookToPassage, type GoalPassage } from './passages';

export type ReadingGoalTemplateId =
  | 'whole_bible'
  | 'old_testament'
  | 'new_testament'
  | 'gospels'
  | 'wisdom';

export type ReadingGoalTemplate = {
  id: ReadingGoalTemplateId;
  bookIndexes: number[];
};

const bookRange = (first: number, last: number): number[] =>
  Array.from({ length: last - first + 1 }, (_, i) => first + i);

/**
 * Pre-made goals offered at the start of goal creation. Book indexes only
 * define a template; goals created from one store `passages` and keep no
 * reference to the template.
 */
export const READING_GOAL_TEMPLATES: ReadonlyArray<ReadingGoalTemplate> = [
  { id: 'whole_bible', bookIndexes: bookRange(1, 66) },
  { id: 'old_testament', bookIndexes: bookRange(1, 39) },
  { id: 'new_testament', bookIndexes: bookRange(40, 66) },
  { id: 'gospels', bookIndexes: bookRange(40, 43) },
  { id: 'wisdom', bookIndexes: bookRange(18, 22) },
];

export const getReadingGoalTemplate = (id: string): ReadingGoalTemplate | undefined =>
  READING_GOAL_TEMPLATES.find(template => template.id === id);

export const getTemplatePassages = (id: string): GoalPassage[] =>
  getReadingGoalTemplate(id)?.bookIndexes.map(bookToPassage) ?? [];
