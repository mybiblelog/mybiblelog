import { describe, it, expect, afterEach } from 'vitest';
import render from '../services/email/email-templates/email-verification';
import { withEnvConfig, restoreEnvConfig } from './config-helpers';

describe('email-verification template', () => {
  afterEach(restoreEnvConfig);

  it('renders a verify-email link with the code and encoded email', () => {
    withEnvConfig({ SITE_URL: 'https://example.test' });

    const { html } = render({
      locale: 'en',
      email: 'user+test@example.com',
      emailVerificationCode: 'XYZ789',
    });

    expect(html).toContain(
      'https://example.test/verify-email?code=XYZ789&amp;email=user%2Btest%40example.com',
    );
  });
});
