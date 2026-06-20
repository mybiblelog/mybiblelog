import { describe, it, expect, beforeEach } from 'vitest';
import type { EmailCreateInput } from '../../repositories/helpers/types';
import { getRepos, clearCollections, expectObjectId } from './helpers';

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
});
