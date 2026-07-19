import { LocaleCode } from '@shared/dist/platform/i18n';
import locales from '../locales/content';
import { substitute } from '../locales/substitute';
import { getLocaleBaseUrl, emailParagraphStyle, renderCodeBlock } from './helpers';
import renderBrandedEmail from './branded-wrapper';

type RenderPasswordResetLinkParams = {
  locale: LocaleCode;
  email: string;
  passwordResetCode: string;
};

const render = ({
  locale,
  email,
  passwordResetCode,
}: RenderPasswordResetLinkParams) => {
  const t = locales[locale].password_reset;
  const subject = t.subject;
  const link = getLocaleBaseUrl(locale)
    + '/reset-password?code=' + passwordResetCode
    + '&email=' + encodeURIComponent(email);
  const p = (html: string) => `<p style="${emailParagraphStyle}">${html}</p>`;
  const contentHtml = [
    p(t.code_intro),
    renderCodeBlock(passwordResetCode),
    p(substitute(t.click_to_reset, { link })),
  ].join('');

  return {
    subject,
    html: renderBrandedEmail({ title: subject, contentHtml }),
  };
};

export default render;
