import { describe, it, expect, afterEach } from 'vitest';
import { getLocaleBaseUrl } from '../services/email/email-templates/helpers';
import { withEnvConfig, restoreEnvConfig } from './config-helpers';

describe('getLocaleBaseUrl', () => {
  afterEach(restoreEnvConfig);

  it('returns siteUrl unmodified for the "en" locale', () => {
    withEnvConfig({ SITE_URL: 'https://example.test' });
    expect(getLocaleBaseUrl('en')).toBe('https://example.test');
  });

  it('appends "/<locale>" for every other locale', () => {
    withEnvConfig({ SITE_URL: 'https://example.test' });
    expect(getLocaleBaseUrl('fr')).toBe('https://example.test/fr');
    expect(getLocaleBaseUrl('de')).toBe('https://example.test/de');
  });
});
