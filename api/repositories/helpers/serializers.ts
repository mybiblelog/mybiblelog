import {
  DailyReminderRecord,
  LogEntryRecord,
  PassageNoteRecord,
  PassageNoteTagRecord,
} from './types';
import { type LogEntryJSON } from '../../validation/schemas/log-entry';

/**
 * Pure response serializers replicating the custom `toJSON` shapes the
 * Mongoose schemas used to provide. Routes call these to build wire payloads.
 */

export const toLogEntryJSON = (logEntry: LogEntryRecord): LogEntryJSON => {
  const { id, date, startVerseId, endVerseId } = logEntry;
  return { id, date, startVerseId, endVerseId };
};

export const toPassageNoteJSON = (passageNote: PassageNoteRecord) => {
  const { id, passages, content, tags } = passageNote;
  return { id, passages, content, tags };
};

export const toPassageNoteTagJSON = (tag: PassageNoteTagRecord) => {
  const { id, label, color, description, noteCount } = tag;
  return { id, label, color, description, noteCount };
};

export const toDailyReminderJSON = (reminder: DailyReminderRecord) => {
  const { id, hour, minute, timezoneOffset, active } = reminder;
  return { id, hour, minute, timezoneOffset, active };
};
