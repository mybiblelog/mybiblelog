/**
 * Enumerated values shared between request validation (zod) and the
 * persistence layer. Kept here, independent of Mongoose, so the validation
 * layer never imports from `mongoose/`.
 */

export const StartPages = ['start', 'today', 'books', 'checklist', 'calendar', 'notes'] as const;

export const PassageNoteTagSortOrders = [
  'label:ascending',
  'createdAt:descending',
  'createdAt:ascending',
  'noteCount:descending',
  'noteCount:ascending',
  'color:hue',
] as const;
