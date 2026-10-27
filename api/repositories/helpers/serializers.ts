import { Bible } from '@mybiblelog/shared';
import {
  AccessTokenRecord,
  DailyReminderRecord,
  LogEntryRecord,
  PassageNoteRecord,
  PassageNoteSearchResultItem,
  PassageNoteTagRecord,
  PassageRecord,
} from './types';
import { type LogEntryJSON } from '../../validation/schemas/log-entry';
import { type AccessTokenJSON } from '../../validation/schemas/access-token';

/**
 * Pure response serializers replicating the custom `toJSON` shapes the
 * Mongoose schemas used to provide. Routes call these to build wire payloads.
 */

export const toLogEntryJSON = (logEntry: LogEntryRecord): LogEntryJSON => {
  const { id, date, startVerseId, endVerseId } = logEntry;
  return { id, date, startVerseId, endVerseId, passage: Bible.formatUsfmReference(startVerseId, endVerseId) };
};

/** Adds the USFM `passage` reference alongside a passage's integer verse ids. */
export const toPassageJSON = (passage: PassageRecord) => ({
  ...passage,
  passage: Bible.formatUsfmReference(passage.startVerseId, passage.endVerseId),
});

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

export const toDailyReminderJSON = (reminder: DailyReminderRecord) => {
  const { id, hour, minute, timezoneOffset, active } = reminder;
  return { id, hour, minute, timezoneOffset, active };
};

export const toAccessTokenJSON = (accessToken: AccessTokenRecord): AccessTokenJSON => {
  const { id, name, prefix, scopes, createdAt, expiresAt, lastUsedAt } = accessToken;
  return {
    id,
    name,
    prefix,
    scopes,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastUsedAt: lastUsedAt ? lastUsedAt.toISOString() : null,
  };
};
