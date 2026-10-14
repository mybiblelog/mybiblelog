import { describe, it, expect } from 'vitest';
import { requestApi } from './helpers';

const { SITE_URL } = process.env;
if (!SITE_URL) {
  throw new Error('SITE_URL environment variable is not set');
}

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

    it('returns 403 for state-changing requests with an unparseable Origin header', async () => {
      // This origin string passes the CORS layer's plain startsWith() check (it looks
      // like a localhost origin) but is not a valid URL, so `new URL(origin)` throws
      // inside the CSRF middleware and must be caught rather than crashing the request.
      const response = await requestApi
        .post('/api/non-existent-route')
        .set('Origin', 'http://localhost:not-a-port')
        .send({ any: 'payload' });

      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        error: {
          code: 'unauthorized',
        },
      });
    });
  });

  describe('CORS origin policy', () => {
    it('allows requests with no Origin header', async () => {
      const response = await requestApi.get('/api/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('allows the configured site URL as Origin', async () => {
      const response = await requestApi
        .get('/api/non-existent-route')
        .set('Origin', SITE_URL);

      expect(response.headers['access-control-allow-origin']).toBe(SITE_URL);
      expect(response.status).toBe(404);
    });

    it('allows any localhost origin in development, regardless of port', async () => {
      const response = await requestApi
        .get('/api/non-existent-route')
        .set('Origin', 'http://localhost:54321');

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:54321');
      expect(response.status).toBe(404);
    });

    it('allows any 127.0.0.1 origin in development, regardless of port', async () => {
      const response = await requestApi
        .get('/api/non-existent-route')
        .set('Origin', 'http://127.0.0.1:54321');

      expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:54321');
      expect(response.status).toBe(404);
    });

    it('rejects an Origin that does not match the site URL or dev loopback patterns', async () => {
      const response = await requestApi
        .get('/api/non-existent-route')
        .set('Origin', 'https://evil.example.com');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
      expect(response.status).toBe(500);
    });
  });
});

