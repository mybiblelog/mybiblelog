import { describe, it, expect, beforeEach } from 'vitest';
import type { EmailCreateInput } from '../../repositories/helpers/types';
import { getRepos, clearCollections, expectObjectId, sleep } from './helpers';

const emailInput = (overrides: Partial<EmailCreateInput> = {}): EmailCreateInput => ({
  from: 'noreply@example.com',
  to: 'user@example.com',
  subject: 'Hello',
  text: 'Plain body',
  status: 'sent',
  ...overrides,
});

describe('email.repository', () => {
  beforeEach(async () => {
    await clearCollections();
  });

  describe('create', () => {
    it('persists an email with an ObjectId id, status, headers, and timestamps', async () => {
      const { emails } = await getRepos();

      const record = await emails.create(emailInput({ headers: { 'X-Test': 'abc' } }));

      expectObjectId(record.id);
      expect(record.from).toBe('noreply@example.com');
      expect(record.status).toBe('sent');
      expect(record.headers).toEqual({ 'X-Test': 'abc' }); // Map round-trips to a plain record
      expect(record.replyTo).toBeNull(); // omitted -> null
      expect(record.text).toBe('Plain body');
      expect(record.html).toBeNull();
      expect(record.createdAt).toBeInstanceOf(Date);
      expect(record.updatedAt).toBeInstanceOf(Date);
    });

    it('accepts an html-only email', async () => {
      const { emails } = await getRepos();
      const record = await emails.create(emailInput({ text: undefined, html: '<p>Hi</p>' }));
      expect(record.html).toBe('<p>Hi</p>');
      expect(record.text).toBeNull();
    });

    it('rejects an email with neither text nor html (pre-validate hook)', async () => {
      const { emails } = await getRepos();
      await expect(emails.create(emailInput({ text: undefined, html: undefined }))).rejects.toThrow();
    });

    it('rejects an invalid status value', async () => {
      const { emails } = await getRepos();
      await expect(emails.create(emailInput({ status: 'bogus' as never }))).rejects.toThrow();
    });
  });

  describe('findRecentByRecipient', () => {
    it('returns only emails to the recipient, newest first', async () => {
      const { emails } = await getRepos();
      // Space the inserts so createdAt is strictly ordered (the repo sorts on it).
      await emails.create(emailInput({ to: 'alice@example.com', subject: 'First' }));
      await sleep(5);
      await emails.create(emailInput({ to: 'bob@example.com', subject: 'Other recipient' }));
      await sleep(5);
      await emails.create(emailInput({ to: 'alice@example.com', subject: 'Second' }));

      const results = await emails.findRecentByRecipient('alice@example.com');

      expect(results.map((e) => e.subject)).toEqual(['Second', 'First']);
      expect(results.every((e) => e.to === 'alice@example.com')).toBe(true);
    });

    it('matches the recipient case-insensitively', async () => {
      const { emails } = await getRepos();
      await emails.create(emailInput({ to: 'casey@example.com', subject: 'Hello' }));

      const results = await emails.findRecentByRecipient('Casey@Example.com');

      expect(results).toHaveLength(1);
    });

    it('filters by a case-insensitive subject substring', async () => {
      const { emails } = await getRepos();
      await emails.create(emailInput({ to: 'dana@example.com', subject: 'Reset Password' }));
      await emails.create(emailInput({ to: 'dana@example.com', subject: 'Email Verification' }));

      const results = await emails.findRecentByRecipient('dana@example.com', { subject: 'reset' });

      expect(results).toHaveLength(1);
      expect(results[0].subject).toBe('Reset Password');
    });

    it('treats subject filter characters literally (no regex injection)', async () => {
      const { emails } = await getRepos();
      await emails.create(emailInput({ to: 'erin@example.com', subject: 'Reset Password' }));

      const results = await emails.findRecentByRecipient('erin@example.com', { subject: '.*' });

      expect(results).toHaveLength(0);
    });

    it('honors the limit', async () => {
      const { emails } = await getRepos();
      await emails.create(emailInput({ to: 'finn@example.com', subject: 'A' }));
      await emails.create(emailInput({ to: 'finn@example.com', subject: 'B' }));
      await emails.create(emailInput({ to: 'finn@example.com', subject: 'C' }));

      const results = await emails.findRecentByRecipient('finn@example.com', { limit: 2 });

      expect(results).toHaveLength(2);
    });
  });
});
