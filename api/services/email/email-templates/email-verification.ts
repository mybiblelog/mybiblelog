import { LocaleCode } from '@shared/dist/platform/i18n';
import locales from '../locales/content';
import { substitute } from '../locales/substitute';
import { getLocaleBaseUrl, emailParagraphStyle, renderCodeBlock } from './helpers';
import renderBrandedEmail from './branded-wrapper';

type RenderEmailVerificationParams = {
  locale: LocaleCode;
  email: string;
  emailVerificationCode: string;
};

const render = ({ locale, email, emailVerificationCode }: RenderEmailVerificationParams) => {
  const t = locales[locale].email_verification;
  const subject = t.subject;
  // The link carries both the code and the account email so the same
  // email-scoped endpoint validates it, exactly as the typed code does.
  const link = getLocaleBaseUrl(locale)
    + '/verify-email?code=' + emailVerificationCode
    + '&email=' + encodeURIComponent(email);
  const p = (html: string) => `<p style="${emailParagraphStyle}">${html}</p>`;
  const contentHtml = [
    p(t.code_intro),
    renderCodeBlock(emailVerificationCode),
    p(substitute(t.click_to_verify, { link })),
  ].join('');

  return {
    subject,
    html: renderBrandedEmail({ title: subject, contentHtml }),
  };
};

export default render;
