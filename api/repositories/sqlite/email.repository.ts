import { and, desc, eq, sql, type SQL } from 'drizzle-orm';
import type { SqliteDb } from '../../sqlite/database';
import { generateId } from '../../sqlite/ids';
import { emails } from '../../sqlite/schema';
import type { EmailRepository } from '../email.repository';
import { EmailCreateInput, EmailRecord, EmailStatus } from '../helpers/types';
import { validateEmail } from '../helpers/validators';

const DEFAULT_RECENT_LIMIT = 10;

type EmailRow = typeof emails.$inferSelect;

const toEmailRecord = (row: EmailRow): EmailRecord => ({
  id: row.id,
  from: row.from,
  to: row.to,
  replyTo: row.replyTo,
  headers: { ...row.headers },
  subject: row.subject,
  text: row.text,
  html: row.html,
  status: row.status as EmailStatus,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const createSqliteEmailRepository = (db: SqliteDb): EmailRepository => {
  return {
    async create(input: EmailCreateInput): Promise<EmailRecord> {
      validateEmail(input);
      const now = new Date();
      const row: EmailRow = {
        id: generateId(),
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
      await db.insert(emails).values(row);
      return toEmailRecord(row);
    },

    async findRecentByRecipient(
      to: string,
      opts: { subject?: string; limit?: number } = {},
    ): Promise<EmailRecord[]> {
      const conditions: SQL[] = [eq(emails.to, to.toLowerCase())];
      if (opts.subject) {
        // Case-insensitive literal substring match (instr has no wildcards to escape).
        conditions.push(sql`instr(lower(${emails.subject}), ${opts.subject.toLowerCase()}) > 0`);
      }
      const rows = await db.select().from(emails)
        .where(and(...conditions))
        .orderBy(desc(emails.createdAt))
        .limit(opts.limit ?? DEFAULT_RECENT_LIMIT);
      return rows.map(toEmailRecord);
    },
  };
};
