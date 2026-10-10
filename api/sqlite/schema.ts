import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { UserSettingsRecord } from '../repositories/helpers/types';

/**
 * Relational schema for the SQLite (and, later, D1) repository implementation.
 * Mirrors the Mongo documents in `mongo/documents.ts`, with embedded arrays and
 * maps split into child tables where they are queried (note passages and tags,
 * per-platform activity) and kept as JSON where they are only read whole
 * (settings, old emails, email headers).
 *
 * Ids are 24-hex ObjectId-format strings (`sqlite/ids.ts`) so ids look the same
 * to clients whichever backend issued them. Owner columns deliberately carry no
 * foreign key to `users`: like the Mongo collections, owned data is removed by
 * the repositories (`deleteAllByOwner`), not by the database.
 *
 * After changing this file, regenerate migrations with `npm run db:generate`.
 */

const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' });

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  isAdmin: integer('is_admin', { mode: 'boolean' }).notNull(),
  password: text('password'),
  googleId: text('google_id'),
  emailVerificationCode: text('email_verification_code').notNull(),
  emailVerificationExpires: timestamp('email_verification_expires').notNull(),
  emailVerificationCodeLastSentAt: timestamp('email_verification_code_last_sent_at').notNull(),
  emailVerificationAttempts: integer('email_verification_attempts').notNull(),
  existingAccountNoticeLastSentAt: timestamp('existing_account_notice_last_sent_at').notNull(),
  newEmail: text('new_email'),
  newEmailVerificationCode: text('new_email_verification_code').notNull(),
  newEmailVerificationExpires: timestamp('new_email_verification_expires').notNull(),
  newEmailVerificationAttempts: integer('new_email_verification_attempts').notNull(),
  oldEmails: text('old_emails', { mode: 'json' }).$type<string[]>().notNull(),
  passwordResetCode: text('password_reset_code').notNull(),
  passwordResetExpires: timestamp('password_reset_expires').notNull(),
  passwordResetAttempts: integer('password_reset_attempts').notNull(),
  tokenVersion: integer('token_version').notNull(),
  settings: text('settings', { mode: 'json' }).$type<UserSettingsRecord>().notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => [
  uniqueIndex('users_email_unique').on(table.email),
  index('users_created_at_idx').on(table.createdAt),
]);

export const userPlatforms = sqliteTable('user_platforms', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(),
  firstSeenAt: timestamp('first_seen_at').notNull(),
  lastSeenAt: timestamp('last_seen_at').notNull(),
  appVersion: text('app_version'),
}, (table) => [
  primaryKey({ columns: [table.userId, table.platform] }),
]);

export const logEntries = sqliteTable('log_entries', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  date: text('date').notNull(),
  startVerseId: integer('start_verse_id').notNull(),
  endVerseId: integer('end_verse_id').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => [
  index('log_entries_owner_date_idx').on(table.ownerId, table.date),
  index('log_entries_date_idx').on(table.date),
]);

// Full-text search over `content` lives in the `passage_notes_fts` FTS5 table,
// kept in sync by triggers (both defined in a custom migration, since Drizzle
// cannot model virtual tables).
export const passageNotes = sqliteTable('passage_notes', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => [
  index('passage_notes_owner_created_at_idx').on(table.ownerId, table.createdAt),
  index('passage_notes_created_at_idx').on(table.createdAt),
]);

export const passageNotePassages = sqliteTable('passage_note_passages', {
  id: text('id').primaryKey(),
  noteId: text('note_id').notNull().references(() => passageNotes.id, { onDelete: 'cascade' }),
  // Order within the note, preserved from the input array.
  position: integer('position').notNull(),
  startVerseId: integer('start_verse_id').notNull(),
  endVerseId: integer('end_verse_id').notNull(),
}, (table) => [
  index('passage_note_passages_note_idx').on(table.noteId, table.position),
]);

// No foreign key to `passage_note_tags`: deleting a tag leaves its id on notes,
// exactly as the Mongo `tags` array does.
export const passageNoteTagLinks = sqliteTable('passage_note_tag_links', {
  noteId: text('note_id').notNull().references(() => passageNotes.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull(),
  // Order within the note; `exact` tag matching compares the ordered list.
  position: integer('position').notNull(),
}, (table) => [
  primaryKey({ columns: [table.noteId, table.position] }),
  index('passage_note_tag_links_tag_idx').on(table.tagId),
]);

export const passageNoteTags = sqliteTable('passage_note_tags', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  label: text('label').notNull(),
  color: text('color').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => [
  uniqueIndex('passage_note_tags_owner_label_unique').on(table.ownerId, table.label),
]);

export const dailyReminders = sqliteTable('daily_reminders', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  hour: integer('hour').notNull(),
  minute: integer('minute').notNull(),
  timezoneOffset: integer('timezone_offset').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull(),
  publicToken: text('public_token').notNull(),
  emailsSentSinceLastEngagement: integer('emails_sent_since_last_engagement').notNull(),
  nextOccurrence: integer('next_occurrence').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => [
  index('daily_reminders_owner_idx').on(table.ownerId),
  index('daily_reminders_public_token_idx').on(table.publicToken),
  index('daily_reminders_due_idx').on(table.active, table.nextOccurrence),
]);

export const feedback = sqliteTable('feedback', {
  id: text('id').primaryKey(),
  ip: text('ip').notNull(),
  ownerId: text('owner_id'),
  email: text('email').notNull(),
  kind: text('kind').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => [
  index('feedback_status_created_at_idx').on(table.status, table.createdAt),
  index('feedback_created_at_idx').on(table.createdAt),
  index('feedback_owner_idx').on(table.ownerId),
]);

export const emails = sqliteTable('emails', {
  id: text('id').primaryKey(),
  from: text('from_address').notNull(),
  to: text('to_address').notNull(),
  replyTo: text('reply_to'),
  headers: text('headers', { mode: 'json' }).$type<Record<string, string>>().notNull(),
  subject: text('subject').notNull(),
  text: text('text'),
  html: text('html'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
}, (table) => [
  index('emails_to_created_at_idx').on(table.to, table.createdAt),
]);
