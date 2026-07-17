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
  // When the "you already have an account" notice was last sent to this address,
  // used to cool down repeated notices when someone re-registers a taken email.
  existingAccountNoticeLastSentAt: Date;
  newEmail: string | null;
  newEmailVerificationCode: string;
  newEmailVerificationExpires: Date;
  oldEmails: string[];
  passwordResetCode: string;
  passwordResetExpires: Date;
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

/** A plan day carries no stored number — day N is simply position N (1-based). */
export interface PlanDaySubdocument {
  _id: ObjectId;
  passages: PassageSubdocument[];
}

export interface ReadingPlanDocument {
  _id: ObjectId;
  owner: ObjectId;
  name: string;
  /** Ordered series of days that make up the plan. */
  days: PlanDaySubdocument[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PlanTrackerDocument {
  _id: ObjectId;
  owner: ObjectId;
  planId: ObjectId;
  /** `YYYY-MM-DD`. Only reading logged on/after this date counts toward the tracker. */
  startDate: string;
  /** `YYYY-MM-DD` when the plan was finished, or `null` while still in progress. */
  completedDate: string | null;
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
