import { LocaleCode } from '@shared/dist/platform/i18n';
import locales from '../locales/content';
import { substitute } from '../locales/substitute';
import { getLocaleBaseUrl, emailParagraphStyle, renderCodeBlock } from './helpers';
import renderBrandedEmail from './branded-wrapper';

type RenderEmailUpdateParams = {
  locale: LocaleCode;
  currentEmail: string;
  newEmail: string;
  newEmailVerificationCode: string;
};

const render = ({
  locale,
  currentEmail,
  newEmail,
  newEmailVerificationCode,
}: RenderEmailUpdateParams) => {
  const t = locales[locale].email_update;
  const subject = t.subject;
  // Completion looks the account up by its CURRENT email (which holds the
  // pending code), so the link embeds currentEmail — not the new address.
  const link = getLocaleBaseUrl(locale)
    + '/change-email?code=' + newEmailVerificationCode
    + '&email=' + encodeURIComponent(currentEmail);
  const p = (html: string) => `<p style="${emailParagraphStyle}">${html}</p>`;
  const contentHtml = [
    p(substitute(t.email_update_requested, { currentEmail, newEmail })),
    p(t.code_intro),
    renderCodeBlock(newEmailVerificationCode),
    p(substitute(t.click_to_confirm, { link, newEmail })),
    p(t.if_you_did_not_request),
  ].join('');

  return {
    subject,
    html: renderBrandedEmail({ title: subject, contentHtml }),
  };
};

export default render;
