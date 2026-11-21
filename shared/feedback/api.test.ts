import { describe, expect, it, vi } from 'vitest';
import type { HttpClient } from '../platform/http-client.js';
import { postFeedback } from './api.js';

describe('postFeedback', () => {
  it('posts the feedback body to /api/feedback', async () => {
    const http = { post: vi.fn().mockResolvedValue({ data: {} }) } as unknown as HttpClient;
    const input = { email: 'a@b.com', kind: 'bug' as const, message: 'Broken' };
    await postFeedback(http, input);
    expect(http.post).toHaveBeenCalledWith('/api/feedback', input);
  });
});
