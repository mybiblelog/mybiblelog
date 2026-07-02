import { ObjectId, type Filter } from 'mongodb';
import type { Collections } from '../mongo/useCollections';
import type { EmailDocument } from '../mongo/documents';
import { EmailCreateInput, EmailRecord, EmailStatus } from './helpers/types';

const EMAIL_STATUSES: EmailStatus[] = ['pending', 'sent', 'failed', 'log_only'];

/** Escapes a string so it can be used as a literal inside a RegExp. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const DEFAULT_RECENT_LIMIT = 10;

const toEmailRecord = (doc: EmailDocument): EmailRecord => {
  return {
    id: doc._id.toString(),
    from: doc.from,
    to: doc.to,
    replyTo: doc.replyTo ?? null,
    headers: doc.headers ? { ...doc.headers } : {},
    subject: doc.subject,
    text: doc.text ?? null,
    html: doc.html ?? null,
    status: doc.status as EmailStatus,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

export const createEmailRepository = ({ emails }: Collections) => {
  return {
    /**
     * Persists a record of an email send attempt. Callers typically do not
     * await this — it records the outcome as a side effect of delivery.
     */
    async create(input: EmailCreateInput): Promise<EmailRecord> {
      // An email must carry a body in at least one format (replaces the
      // Email pre-validate hook).
      if (!input.text && !input.html) {
        throw new Error('Text or HTML required');
      }
      // Replaces the Email `status` enum schema validator.
      if (!EMAIL_STATUSES.includes(input.status)) {
        throw new Error(`${input.status} is not a valid email status`);
      }
      const now = new Date();
      const doc: EmailDocument = {
        _id: new ObjectId(),
        from: input.from,
        to: input.to,
        replyTo: input.replyTo ?? null,
        headers: input.headers ?? {},
        subject: input.subject,
        text: input.text ?? null,
        html: input.html ?? null,
        status: input.status,
        createdAt: now,
        updatedAt: now,
      };
      await emails.insertOne(doc);
      return toEmailRecord(doc);
    },

    /**
     * Returns the emails most recently recorded for a recipient, newest first.
     *
     * Backs the test-only email seam (`GET /test/emails`): the e2e suite reads the
     * persisted email to recover one-time codes (verify-email, reset-password,
     * change-email) that are otherwise only delivered by email. Recipients are
     * stored lower-cased (see how the user/email layer normalizes addresses), so
     * the lookup lower-cases `to` to match. `subject`, when given, is a
     * case-insensitive substring filter.
     */
    async findRecentByRecipient(
      to: string,
      opts: { subject?: string; limit?: number } = {},
    ): Promise<EmailRecord[]> {
      const filter: Filter<EmailDocument> = { to: to.toLowerCase() };
      if (opts.subject) {
        filter.subject = { $regex: escapeRegExp(opts.subject), $options: 'i' };
      }
      const limit = opts.limit ?? DEFAULT_RECENT_LIMIT;
      const docs = await emails
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
      return docs.map(toEmailRecord);
    },
  };
};

export type EmailRepository = ReturnType<typeof createEmailRepository>;
