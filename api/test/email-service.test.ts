import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Unit tests for `sendFn` inside `useEmailService` (services/email/email-service.ts).
 * `sendFn` is not exported directly — it is exercised indirectly via
 * `emailService.send(...)`, which enqueues the job and runs it off the queue
 * (see `email-queue.ts`). The queue's `enqueue` does not return a promise, so
 * tests use `vi.waitFor` to observe the eventual `emails.create` call.
 *
 * `useEmailService` caches its result in a module-level singleton, and `sendFn`
 * captures `nodeEnv` from `getConfig()` at init time, so each test resets
 * modules and re-mocks dependencies to get a fresh instance for its own
 * production/non-production branch.
 */

const baseConfig = {
  emailSendingDomain: 'example.com',
  siteUrl: 'https://app.example.com',
  resendApiKey: 'test-key',
};

describe('email-service sendFn (unit)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('records status "sent" when sending succeeds in production', async () => {
    const create = vi.fn(async (input: unknown) => input);
    const sendEmail = vi.fn(async () => ({ id: 'resend-id' }));

    vi.doMock('../config', () => ({
      getConfig: () => ({ ...baseConfig, nodeEnv: 'production' }),
    }));
    vi.doMock('../repositories/useRepositories', () => ({
      default: async () => ({ emails: { create } }),
    }));
    vi.doMock('../services/email/email-senders/resend', () => ({
      default: sendEmail,
    }));

    const useEmailService = (await import('../services/email/email-service')).default;
    const emailService = await useEmailService();

    emailService.send({ from: 'a@example.com', to: 'user@example.com', subject: 'Hi', text: 'hello' });

    await vi.waitFor(() => expect(create).toHaveBeenCalled());

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: 'sent', to: 'user@example.com' }));
  });

  it('records status "failed" when sending throws in production', async () => {
    const create = vi.fn(async (input: unknown) => input);
    const sendEmail = vi.fn(async () => {
      throw new Error('provider down');
    });

    vi.doMock('../config', () => ({
      getConfig: () => ({ ...baseConfig, nodeEnv: 'production' }),
    }));
    vi.doMock('../repositories/useRepositories', () => ({
      default: async () => ({ emails: { create } }),
    }));
    vi.doMock('../services/email/email-senders/resend', () => ({
      default: sendEmail,
    }));

    const useEmailService = (await import('../services/email/email-service')).default;
    const emailService = await useEmailService();

    emailService.send({ from: 'a@example.com', to: 'user@example.com', subject: 'Hi', text: 'hello' });

    await vi.waitFor(() => expect(create).toHaveBeenCalled());

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed', to: 'user@example.com' }));
  });

  it('records status "log_only" and does not call the sender outside production', async () => {
    const create = vi.fn(async (input: unknown) => input);
    const sendEmail = vi.fn(async () => ({ id: 'resend-id' }));

    vi.doMock('../config', () => ({
      getConfig: () => ({ ...baseConfig, nodeEnv: 'test' }),
    }));
    vi.doMock('../repositories/useRepositories', () => ({
      default: async () => ({ emails: { create } }),
    }));
    vi.doMock('../services/email/email-senders/resend', () => ({
      default: sendEmail,
    }));

    const useEmailService = (await import('../services/email/email-service')).default;
    const emailService = await useEmailService();

    emailService.send({ from: 'a@example.com', to: 'user@example.com', subject: 'Hi', text: 'hello' });

    await vi.waitFor(() => expect(create).toHaveBeenCalled());

    expect(sendEmail).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ status: 'log_only', to: 'user@example.com' }));
  });

  it('logs but does not throw (fire-and-forget) when recording the email fails', async () => {
    const create = vi.fn(async () => {
      throw new Error('mongo validation error');
    });
    const sendEmail = vi.fn(async () => ({ id: 'resend-id' }));
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    vi.doMock('../config', () => ({
      getConfig: () => ({ ...baseConfig, nodeEnv: 'test' }),
    }));
    vi.doMock('../repositories/useRepositories', () => ({
      default: async () => ({ emails: { create } }),
    }));
    vi.doMock('../services/email/email-senders/resend', () => ({
      default: sendEmail,
    }));

    const useEmailService = (await import('../services/email/email-service')).default;
    const emailService = await useEmailService();

    emailService.send({ from: 'a@example.com', to: 'user@example.com', subject: 'Hi', text: 'hello' });

    await vi.waitFor(() => expect(create).toHaveBeenCalled());
    await vi.waitFor(() => expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to record email:', expect.any(Error)));

    consoleErrorSpy.mockRestore();
  });
});
