import { describe, it, expect, afterEach } from 'vitest';
import render from '../services/email/email-templates/email-update';
import { withEnvConfig, restoreEnvConfig } from './config-helpers';

/**
 * The completion endpoint looks the account up by its CURRENT email (it holds
 * the pending code), so the confirmation link must embed `currentEmail` — not
 * `newEmail` — and it must be URL-encoded since email addresses can contain
 * characters like `+` that are meaningful in a query string.
 */
describe('email-update template', () => {
  afterEach(restoreEnvConfig);

  it('renders a change-email link with the code and encoded current email', () => {
    withEnvConfig({ SITE_URL: 'https://example.test' });

    const { html } = render({
      locale: 'en',
      currentEmail: 'current+user@example.com',
      newEmail: 'new@example.com',
      newEmailVerificationCode: 'ABC123',
    });

    expect(html).toContain(
      'https://example.test/change-email?code=ABC123&amp;email=current%2Buser%40example.com',
    );
  });
});
