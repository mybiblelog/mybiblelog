import { Bible, type VerseRange } from '@mybiblelog/shared';
import {
  DailyReminderRecord,
  LogEntryRecord,
  PassageNoteRecord,
  PassageNoteSearchResultItem,
  PassageNoteTagRecord,
  ReadingGoalRecord,
} from './types';
import { type LogEntryJSON } from '../../validation/schemas/log-entry';

/**
 * Pure response serializers replicating the custom `toJSON` shapes the
 * Mongoose schemas used to provide. Routes call these to build wire payloads.
 */

/** Adds the USFM `passage` reference alongside a passage's integer verse ids. */
export const toPassageJSON = <T extends VerseRange>(passage: T) => ({
  ...passage,
  passage: Bible.formatUsfmReference(passage.startVerseId, passage.endVerseId),
});

export const toLogEntryJSON = (logEntry: LogEntryRecord): LogEntryJSON => {
  const { id, date, startVerseId, endVerseId } = logEntry;
  return { id, date, ...toPassageJSON({ startVerseId, endVerseId }) };
};

export const toPassageNoteJSON = (passageNote: PassageNoteRecord) => {
  const { id, passages, content, tags } = passageNote;
  return { id, passages: passages.map(toPassageJSON), content, tags };
};

export const toPassageNoteSearchResultJSON = (result: PassageNoteSearchResultItem) => ({
  ...result,
  passages: result.passages.map(toPassageJSON),
});

export const toPassageNoteTagJSON = (tag: PassageNoteTagRecord) => {
  const { id, label, color, description, noteCount } = tag;
  return { id, label, color, description, noteCount };
};

export const toReadingGoalJSON = (goal: ReadingGoalRecord) => {
  const { id, title, passages, startDate, endDate, active } = goal;
  return { id, title, passages, startDate, endDate, active };
};

export const toDailyReminderJSON = (reminder: DailyReminderRecord) => {
  const { id, hour, minute, timezoneOffset, active } = reminder;
  return { id, hour, minute, timezoneOffset, active };
};
