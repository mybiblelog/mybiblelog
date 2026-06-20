import type useMongooseModels from '../mongoose/useMongooseModels';
import { EmailCreateInput, EmailRecord, EmailStatus } from './helpers/types';

type Models = Awaited<ReturnType<typeof useMongooseModels>>;
type EmailDoc = ReturnType<Models['Email']['hydrate']>;

const toHeadersRecord = (headers: EmailDoc['headers']): Record<string, string> => {
  // The schema stores headers as a Map; older/plain documents may already be objects.
  if (headers instanceof Map) {
    return Object.fromEntries(headers);
  }
  return headers ? { ...(headers as Record<string, string>) } : {};
};

const toEmailRecord = (email: EmailDoc): EmailRecord => {
  return {
    id: email._id.toString(),
    from: email.from,
    to: email.to,
    replyTo: email.replyTo ?? null,
    headers: toHeadersRecord(email.headers),
    subject: email.subject,
    text: email.text ?? null,
    html: email.html ?? null,
    status: email.status as EmailStatus,
    createdAt: email.createdAt,
    updatedAt: email.updatedAt,
  };
};

export const createEmailRepository = ({ Email }: Models) => {
  return {
    /**
     * Persists a record of an email send attempt. Callers typically do not
     * await this — it records the outcome as a side effect of delivery.
     */
    async create(input: EmailCreateInput): Promise<EmailRecord> {
      const email = await Email.create(input);
      return toEmailRecord(email);
    },
  };
};

export type EmailRepository = ReturnType<typeof createEmailRepository>;
