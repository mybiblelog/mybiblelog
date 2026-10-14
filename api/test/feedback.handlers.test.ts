import { describe, it, expect, vi } from 'vitest';
import { submitFeedback } from '../http/handlers/feedback';
import { type HttpRequest, type RouteDependencies } from '../http/types';
import { type FeedbackRecord } from '../repositories/helpers/types';

/**
 * Pure unit tests for the framework-agnostic feedback handler, focused on the
 * admin-notification branch (`shouldNotifyAdminsOfFeedback` -> `listAdminEmails`
 * -> `queueNewFeedbackNotification`). `feedback.test.ts` exercises the route
 * end-to-end against the real DB/emailService, where that gate's outcome is
 * nondeterministic (it depends on the most recent feedback's real `createdAt`)
 * and nothing asserts admins were actually notified. These tests call the
 * handler directly with fakes so the gate can be forced both ways.
 */

const sampleFeedback: FeedbackRecord = {
  _id: '507f1f77bcf86cd799439011',
  ip: '127.0.0.1',
  owner: null,
  email: 'reporter@example.com',
  kind: 'bug',
  message: 'Something is broken',
  status: 'open',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

const makeDeps = (overrides: {
  feedback?: Partial<RouteDependencies['repositories']['feedback']>;
  users?: Partial<RouteDependencies['repositories']['users']>;
  emailService?: Partial<RouteDependencies['emailService']>;
  authenticate?: RouteDependencies['authenticate'];
} = {}): RouteDependencies => {
  return {
    repositories: {
      feedback: {
        findMostRecentCreatedAt: async () => null,
        create: async () => sampleFeedback,
        ...overrides.feedback,
      },
      users: {
        listAdminEmails: async () => [],
        ...overrides.users,
      },
    } as RouteDependencies['repositories'],
    authenticate: overrides.authenticate ?? (async () => null),
    emailService: {
      queueNewFeedbackNotification: vi.fn(),
      ...overrides.emailService,
    } as RouteDependencies['emailService'],
    rateLimiter: { check: async () => {} } as RouteDependencies['rateLimiter'],
  };
};

const makeRequest = (overrides: Partial<HttpRequest> = {}): HttpRequest => ({
  method: 'POST',
  params: {},
  query: {},
  body: { email: 'reporter@example.com', kind: 'bug', message: 'Something is broken' },
  headers: {},
  ...overrides,
});

describe('submitFeedback handler (unit)', () => {
  it('notifies every admin when the gate is true (no previous feedback)', async () => {
    const queueNewFeedbackNotification = vi.fn();
    const deps = makeDeps({
      feedback: { findMostRecentCreatedAt: async () => null },
      users: { listAdminEmails: async () => ['admin1@example.com', 'admin2@example.com'] },
      emailService: { queueNewFeedbackNotification },
    });

    const result = await submitFeedback(makeRequest(), deps);

    expect(result.status).toBe(201);
    expect(queueNewFeedbackNotification).toHaveBeenCalledTimes(2);
    expect(queueNewFeedbackNotification).toHaveBeenNthCalledWith(1, 'admin1@example.com', {
      kind: sampleFeedback.kind,
      email: sampleFeedback.email,
      message: sampleFeedback.message,
    });
    expect(queueNewFeedbackNotification).toHaveBeenNthCalledWith(2, 'admin2@example.com', {
      kind: sampleFeedback.kind,
      email: sampleFeedback.email,
      message: sampleFeedback.message,
    });
  });

  it('notifies admins when the previous feedback is over an hour old', async () => {
    const queueNewFeedbackNotification = vi.fn();
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const deps = makeDeps({
      feedback: { findMostRecentCreatedAt: async () => twoHoursAgo },
      users: { listAdminEmails: async () => ['admin@example.com'] },
      emailService: { queueNewFeedbackNotification },
    });

    await submitFeedback(makeRequest(), deps);

    expect(queueNewFeedbackNotification).toHaveBeenCalledTimes(1);
    expect(queueNewFeedbackNotification).toHaveBeenCalledWith('admin@example.com', {
      kind: sampleFeedback.kind,
      email: sampleFeedback.email,
      message: sampleFeedback.message,
    });
  });

  it('does not notify anyone when the debounce gate is false', async () => {
    const queueNewFeedbackNotification = vi.fn();
    const listAdminEmails = vi.fn(async () => ['admin@example.com']);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const deps = makeDeps({
      feedback: { findMostRecentCreatedAt: async () => fiveMinutesAgo },
      users: { listAdminEmails },
      emailService: { queueNewFeedbackNotification },
    });

    const result = await submitFeedback(makeRequest(), deps);

    expect(result.status).toBe(201);
    expect(listAdminEmails).not.toHaveBeenCalled();
    expect(queueNewFeedbackNotification).not.toHaveBeenCalled();
  });

  it('does not notify anyone when there are no admin emails', async () => {
    const queueNewFeedbackNotification = vi.fn();
    const deps = makeDeps({
      feedback: { findMostRecentCreatedAt: async () => null },
      users: { listAdminEmails: async () => [] },
      emailService: { queueNewFeedbackNotification },
    });

    await submitFeedback(makeRequest(), deps);

    expect(queueNewFeedbackNotification).not.toHaveBeenCalled();
  });
});
