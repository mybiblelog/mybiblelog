import { LocaleCode } from '@shared/dist/platform/i18n';
import locales from '../locales/content';
import { substitute } from '../locales/substitute';
import { getLocaleBaseUrl } from './helpers';
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
  const contentHtml = [
    `<p>${substitute(t.click_to_reset, { link })}</p>`,
    `<p>${substitute(t.enter_code, { code: passwordResetCode })}</p>`,
  ].join('');

  return {
    subject,
    html: renderBrandedEmail({ title: subject, contentHtml }),
  };
};

export default render;
