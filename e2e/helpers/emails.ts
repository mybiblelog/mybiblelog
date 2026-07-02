/**
 * E2E helpers for the test-only email seam (`GET /api/test/emails`).
 *
 * Email-based flows (verify-email, reset-password, change-email) deliver a
 * one-time code only by email. In lower environments every email is persisted,
 * and the seam returns the recorded copy so a test can recover the code and drive
 * the rest of the flow in the browser. The seam requires the `x-test-bypass-secret`
 * header and returns 404 in production, so this never works against prod.
 *
 * Like `api-client.ts`, this module intentionally does NOT import from the api/
 * workspace — it depends only on the HTTP contract.
 */
import { request } from '@playwright/test';
import { env } from './env';

export interface TestEmail {
  id: string;
  from: string;
  to: string;
  subject: string;
  text: string | null;
  html: string | null;
  status: string;
  createdAt: string;
}

const fetchEmails = async (to: string, subject?: string): Promise<TestEmail[]> => {
  const ctx = await request.newContext({ baseURL: env.apiUrl });
  try {
    const params = new URLSearchParams({ to });
    if (subject) {
      params.set('subject', subject);
    }
    const response = await ctx.get(`/api/test/emails?${params.toString()}`, {
      headers: { 'x-test-bypass-secret': env.bypassSecret },
    });
    if (!response.ok()) {
      throw new Error(`Failed to fetch test emails: ${response.status()} ${await response.text()}`);
    }
    const body = await response.json();
    return body.data as TestEmail[];
  }
  finally {
    await ctx.dispose();
  }
};

interface WaitForEmailOptions {
  to: string;
  /** Optional case-insensitive subject substring filter. */
  subject?: string;
  /** Ignore emails recorded at/before this time (e.g. when the flow started). */
  since?: Date;
  timeoutMs?: number;
  intervalMs?: number;
}

/**
 * Polls the seam until an email to `to` (optionally matching `subject`, and newer
 * than `since`) appears, then returns the newest match. Emails are recorded
 * asynchronously off the send queue, so a single read can race ahead of the
 * write — polling is required.
 */
export const waitForEmail = async ({
  to,
  subject,
  since,
  timeoutMs = 15000,
  intervalMs = 500,
}: WaitForEmailOptions): Promise<TestEmail> => {
  const deadline = Date.now() + timeoutMs;
  let seen = 0;
  for (;;) {
    const emails = await fetchEmails(to, subject);
    seen = emails.length;
    const match = emails.find((email) => !since || new Date(email.createdAt).getTime() > since.getTime());
    if (match) {
      return match;
    }
    if (Date.now() >= deadline) {
      const subjectNote = subject ? ` (subject ~ "${subject}")` : '';
      throw new Error(`Timed out waiting for an email to ${to}${subjectNote}. Saw ${seen} non-matching email(s).`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
};

// The verify/reset/change links all carry the one-time code as `?code=<hex>`
// (see api/services/email/email-templates/*), so one pattern covers every flow.
const CODE_PATTERN = /[?&]code=([0-9a-f]+)/i;

/** Extracts the one-time `code` value from an email body (html preferred, then text). */
export const extractCode = (email: TestEmail): string => {
  const body = email.html ?? email.text ?? '';
  const match = body.match(CODE_PATTERN);
  if (!match) {
    throw new Error(`No code= link found in email "${email.subject}"`);
  }
  return match[1];
};
