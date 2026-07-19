/**
 * Plain domain object types returned by the repository layer.
 *
 * These records are intentionally free of Mongoose document behavior:
 * ids are strings, nested documents are plain objects, and no instance
 * methods exist. Route handlers should only ever see these types.
 */

export interface UserSettingsRecord {
  dailyVerseCountGoal: number;
  lookBackDate: string;
  preferredBibleVersion: string;
  startPage: string;
  passageNoteTagSortOrder: string;
  locale: string;
}

export interface UserRecord {
  id: string;
  email: string;
  isAdmin: boolean;
  /** True when the user has a password (the hash itself never leaves the repository). */
  hasLocalAccount: boolean;
  googleId: string | null;
  /** An empty string means the email address has been verified. */
  emailVerificationCode: string;
  emailVerificationExpires: Date;
  emailVerificationCodeLastSentAt: Date;
  /** Failed submissions against the current email verification code. */
  emailVerificationAttempts: number;
  existingAccountNoticeLastSentAt: Date;
  newEmail: string | null;
  newEmailVerificationCode: string;
  newEmailVerificationExpires: Date;
  /** Failed submissions against the current new-email verification code. */
  newEmailVerificationAttempts: number;
  oldEmails: string[];
  passwordResetCode: string;
  passwordResetExpires: Date;
  /** Failed submissions against the current password reset code. */
  passwordResetAttempts: number;
  /** Bumped to revoke all previously issued JWTs; embedded in and checked against each token. */
  tokenVersion: number;
  settings: UserSettingsRecord;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateInput {
  email: string;
  /** `null` creates an OAuth-only account with no local password. */
  password?: string | null;
  locale?: string;
  googleId?: string;
  emailVerificationCode?: string;
  isAdmin?: boolean;
}

export interface AdminUserListQuery {
  limit: number;
  offset: number;
  sortOn: string;
  sortDirection: 1 | -1;
  searchText: string;
}

export interface AdminUserListItem {
  id: string;
  email: string;
  isAdmin: boolean;
  hasLocalAccount: boolean;
  googleId: string | null;
  emailVerificationExpires: Date;
  newEmail?: string | null;
  oldEmails: string[];
  settings: UserSettingsRecord;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogEntryRecord {
  id: string;
  ownerId: string;
  date: string;
  startVerseId: number;
  endVerseId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogEntryInput {
  date: string;
  startVerseId: number;
  endVerseId: number;
}

/**
 * Passage subdocuments serialize with their `_id` today
 * (the schema does not set `_id: false`), so the record keeps it
 * to preserve the wire shape.
 */
export interface PassageRecord {
  _id: string;
  startVerseId: number;
  endVerseId: number;
}

export interface PassageInput {
  startVerseId: number;
  endVerseId: number;
}

export interface PassageNoteRecord {
  id: string;
  ownerId: string;
  content: string;
  passages: PassageRecord[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PassageNoteInput {
  content?: string;
  passages?: PassageInput[];
  tags?: string[];
}

export interface PassageNoteSearchQuery {
  limit: number;
  offset: number;
  sortOn: string;
  sortDirection: 1 | -1;
  filterTags: string[];
  filterTagMatching: 'any' | 'all' | 'exact';
  searchText: string;
  filterPassageStartVerseId: number;
  filterPassageEndVerseId: number;
  filterPassageMatching: 'inclusive' | 'exclusive';
}

/** Shape produced by the passage note search aggregation (includes timestamps, excludes owner). */
export interface PassageNoteSearchResultItem {
  id: string;
  content: string;
  passages: PassageRecord[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PassageNoteTagRecord {
  id: string;
  ownerId: string;
  label: string;
  color: string;
  description: string;
  /** Not stored in the database; computed and attached per request. */
  noteCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PassageNoteTagInput {
  label?: string;
  color?: string;
  description?: string;
}

export interface DailyReminderRecord {
  id: string;
  ownerId: string;
  hour: number;
  minute: number;
  timezoneOffset: number;
  active: boolean;
  publicToken: string;
  emailsSentSinceLastEngagement: number;
  nextOccurrence: number;
}

export interface DailyReminderPatch {
  hour?: number;
  minute?: number;
  timezoneOffset?: number;
  active?: boolean;
}

export type FeedbackStatus = 'open' | 'resolved' | 'archived';

export interface FeedbackRecord {
  _id: string;
  ip: string;
  owner: string | null;
  email: string;
  kind: string;
  message: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackCreateInput {
  ip: string;
  ownerId: string | null;
  email: string;
  kind: string;
  message: string;
}

export interface FeedbackPatch {
  status: FeedbackStatus;
}

export type EmailStatus = 'pending' | 'sent' | 'failed' | 'log_only';

export interface EmailRecord {
  id: string;
  from: string;
  to: string;
  replyTo: string | null;
  headers: Record<string, string>;
  subject: string;
  text: string | null;
  html: string | null;
  status: EmailStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCreateInput {
  from: string;
  to: string;
  replyTo?: string;
  headers?: Record<string, string>;
  subject: string;
  text?: string;
  html?: string;
  status: EmailStatus;
}
