import { describe, it, expect } from 'vitest';
import { requestApi } from './helpers';

describe('Error Handling', () => {
  describe('API Error Responses', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await requestApi.get('/api/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: {
          code: 'not_found',
        },
      });
    });

    it('returns 403 for state-changing requests with invalid Origin (CSRF protection)', async () => {
      const response = await requestApi
        .post('/api/non-existent-route')
        // CORS allows loopback origins in non-production; CSRF requires SITE_URL origin match.
        .set('Origin', 'http://127.0.0.1:54321')
        .send({ any: 'payload' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: {
          code: 'unauthorized',
        },
      });
    });
  });
});

