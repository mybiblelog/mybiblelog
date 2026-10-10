import dayjs from 'dayjs';
import { Bible } from '@mybiblelog/shared';
import { ApiErrorDetailCode } from '../../http/errors/error-codes';
import { ValidationError } from '../../http/errors/validation-errors';
import { DailyReminderPatch, EmailCreateInput, EmailStatus, FeedbackCreateInput } from './types';

/**
 * Write-time validation shared by every repository implementation. These
 * replace the validators and hooks that lived on the original Mongoose schemas.
 */

// --- Users ---

export const emailInUseError = () =>
  new ValidationError([{ code: ApiErrorDetailCode.EmailInUse, field: 'email' }]);

// --- Log entries ---

/** Replaces the LogEntry `date` schema validator. */
export const assertValidLogEntryDate = (date: string): void => {
  if (!dayjs(date, 'YYYY-MM-DD', true).isValid()) {
    throw new Error(`${date} is not a valid date string`);
  }
};

/** Replaces the LogEntry pre-validate hook and verse-existence validators. */
export const assertValidLogEntryRange = (startVerseId: number, endVerseId: number): void => {
  if (!Bible.validateRange(startVerseId, endVerseId)) {
    throw new Error('Invalid Verse Range');
  }
};

// --- Passage notes ---

const PASSAGE_NOTE_CONTENT_MAX_LENGTH = 3000; // an average single-spaced page

/**
 * Validates a passage note's final state. Replaces the two PassageNote
 * pre-validate hooks (per-passage verse range, and content-or-passages
 * required) plus the content max-length validator.
 */
export const assertValidPassageNote = (
  passages: { startVerseId: number; endVerseId: number }[],
  content: string,
): void => {
  for (const passage of passages) {
    if (!Bible.validateRange(passage.startVerseId, passage.endVerseId)) {
      throw new Error('Invalid Verse Range');
    }
  }
  if (content.length > PASSAGE_NOTE_CONTENT_MAX_LENGTH) {
    throw new Error('Content is too long');
  }
  if (!content.length && !passages.length) {
    throw new Error('One of `passages` or `content` required');
  }
};

// --- Passage note tags ---

const HEX_COLOR_PATTERN = /^#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/;
const TAG_LABEL_MAX_LENGTH = 32;
const TAG_DESCRIPTION_MAX_LENGTH = 1500;

/**
 * Validates and normalizes tag fields. Replaces the field-level validators
 * (required, trim, length, hex color) that lived on the Mongoose schema.
 */
export const normalizeTagLabel = (label: string): string => {
  const trimmed = label.trim();
  if (trimmed.length < 1 || trimmed.length > TAG_LABEL_MAX_LENGTH) {
    throw new Error('Invalid tag label');
  }
  return trimmed;
};

export const validateTagColor = (color: string): void => {
  if (!HEX_COLOR_PATTERN.test(color)) {
    throw new Error(`${color} is not a valid hexadecimal color`);
  }
};

export const normalizeTagDescription = (description: string): string => {
  const trimmed = description.trim();
  if (trimmed.length > TAG_DESCRIPTION_MAX_LENGTH) {
    throw new Error('Tag description is too long');
  }
  return trimmed;
};

export const tagLabelInUseError = () =>
  new ValidationError([{ field: 'label', code: ApiErrorDetailCode.Unique }]);

// --- Daily reminders ---

/** Replaces the DailyReminder schema min/max validators on hour/minute/offset. */
export const assertValidReminderSchedule = (reminder: Required<Pick<DailyReminderPatch, 'hour' | 'minute' | 'timezoneOffset'>>): void => {
  if (reminder.hour < 0 || reminder.hour > 23) {
    throw new Error('hour must be between 0 and 23');
  }
  if (reminder.minute < 0 || reminder.minute > 59) {
    throw new Error('minute must be between 0 and 59');
  }
  if (reminder.timezoneOffset < -12 * 60 || reminder.timezoneOffset > 14 * 60) {
    throw new Error('timezoneOffset is out of range');
  }
};

// --- Feedback ---

const FEEDBACK_KINDS = ['bug', 'feature', 'comment'];
const FEEDBACK_MESSAGE_MAX_LENGTH = 1500; // an average double-spaced page

/** Replaces the Feedback `kind` enum and `message` length schema validators. */
export const validateFeedback = (input: FeedbackCreateInput): void => {
  if (!FEEDBACK_KINDS.includes(input.kind)) {
    throw new Error(`${input.kind} is not a valid feedback kind`);
  }
  if (input.message.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    throw new Error('Feedback message is too long');
  }
};

// --- Emails ---

const EMAIL_STATUSES: EmailStatus[] = ['pending', 'sent', 'failed', 'log_only'];

export const validateEmail = (input: EmailCreateInput): void => {
  // An email must carry a body in at least one format (replaces the
  // Email pre-validate hook).
  if (!input.text && !input.html) {
    throw new Error('Text or HTML required');
  }
  // Replaces the Email `status` enum schema validator.
  if (!EMAIL_STATUSES.includes(input.status)) {
    throw new Error(`${input.status} is not a valid email status`);
  }
};
