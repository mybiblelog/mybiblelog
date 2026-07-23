import { ObjectId } from 'mongodb';

/**
 * Shapes of the documents as they are stored in MongoDB.
 *
 * These mirror what the old Mongoose schemas persisted: `_id`/`owner`/tag refs
 * are `ObjectId`s, timestamps are real `Date`s, and the repository layer is
 * responsible for maintaining `createdAt`/`updatedAt` (Mongoose used to do this
 * via `{ timestamps: true }`).
 */

export interface UserSettingsDocument {
  dailyVerseCountGoal: number;
  lookBackDate: string;
  preferredBibleVersion: string;
  startPage: string;
  passageNoteTagSortOrder: string;
  locale: string;
  /** When true, the reader's canon includes the deuterocanonical books. */
  includeDeuterocanonical: boolean;
}

export interface UserDocument {
  _id: ObjectId;
  email: string;
  isAdmin: boolean;
  /** `null` for OAuth-only accounts with no local password. */
  password: string | null;
  googleId: string | null;
  emailVerificationCode: string;
  emailVerificationExpires: Date;
  emailVerificationCodeLastSentAt: Date;
  // Failed submissions against the current emailVerificationCode. Reset to 0
  // whenever a new code is issued; once it exceeds MAX_CODE_ATTEMPTS the code is
  // treated as invalid, capping brute-force guessing of the short numeric code.
  emailVerificationAttempts: number;
  // When the "you already have an account" notice was last sent to this address,
  // used to cool down repeated notices when someone re-registers a taken email.
  existingAccountNoticeLastSentAt: Date;
  newEmail: string | null;
  newEmailVerificationCode: string;
  newEmailVerificationExpires: Date;
  // Failed submissions against the current newEmailVerificationCode (see above).
  newEmailVerificationAttempts: number;
  oldEmails: string[];
  passwordResetCode: string;
  passwordResetExpires: Date;
  // Failed submissions against the current passwordResetCode (see above).
  passwordResetAttempts: number;
  // Bumped whenever every previously issued JWT should be invalidated (password
  // change/reset/set, or an explicit "log out all sessions"). The value is
  // embedded in each JWT and compared on every request, giving us revocation
  // over otherwise-stateless tokens.
  tokenVersion: number;
  settings: UserSettingsDocument;
  createdAt: Date;
  updatedAt: Date;
}

export interface LogEntryDocument {
  _id: ObjectId;
  owner: ObjectId;
  date: string;
  startVerseId: number;
  endVerseId: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Passage subdocuments carry their own `_id` (Mongoose did not set `_id: false`). */
export interface PassageSubdocument {
  _id: ObjectId;
  startVerseId: number;
  endVerseId: number;
}

export interface PassageNoteDocument {
  _id: ObjectId;
  owner: ObjectId;
  passages: PassageSubdocument[];
  content: string;
  tags: ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PassageNoteTagDocument {
  _id: ObjectId;
  owner: ObjectId;
  label: string;
  color: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyReminderDocument {
  _id: ObjectId;
  owner: ObjectId;
  hour: number;
  minute: number;
  timezoneOffset: number;
  active: boolean;
  publicToken: string;
  emailsSentSinceLastEngagement: number;
  nextOccurrence: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackDocument {
  _id: ObjectId;
  ip: string;
  owner: ObjectId | null;
  email: string;
  kind: string;
  message: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailDocument {
  _id: ObjectId;
  from: string;
  to: string;
  replyTo?: string | null;
  headers: Record<string, string>;
  subject: string;
  text?: string | null;
  html?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
