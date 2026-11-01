import { describe, it, expect, vi, afterEach } from 'vitest';

/**
 * Unit tests for the Resend-backed `sendEmail` — the only active production
 * email sender. Mocks the `resend` package so both the success and
 * error-throwing branches of `resend.emails.send`'s `{ data, error }` result
 * are exercised without a real network call.
 */

const send = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(function() {
    return { emails: { send } };
  }),
}));

vi.mock('../config', () => ({
  getConfig: () => ({ resendApiKey: 'test-resend-api-key' }),
}));

import sendEmail from '../services/email/email-senders/resend';

const baseParams = {
  from: 'team@example.com',
  to: 'user@example.com',
  replyTo: 'reply@example.com',
  subject: 'Hello',
  html: '<p>Hi</p>',
};

describe('resend sendEmail', () => {
  afterEach(() => {
    send.mockReset();
  });

  it('returns data on success', async () => {
    const data = { id: 'email-123' };
    send.mockResolvedValue({ data, error: null });

    const result = await sendEmail(baseParams);

    expect(result).toBe(data);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      from: baseParams.from,
      to: baseParams.to,
      replyTo: baseParams.replyTo,
      subject: baseParams.subject,
      headers: {},
      attachments: [],
    }));
  });

  it('throws the Resend error when the send fails', async () => {
    const error = { name: 'validation_error', message: 'Invalid `to` field' };
    send.mockResolvedValue({ data: null, error });

    await expect(sendEmail(baseParams)).rejects.toBe(error);
  });
});
