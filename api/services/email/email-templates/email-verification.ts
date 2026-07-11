import { LocaleCode } from '@shared/dist/platform/i18n';
import locales from '../locales/content';
import { substitute } from '../locales/substitute';
import { getLocaleBaseUrl } from './helpers';
import renderBrandedEmail from './branded-wrapper';

type RenderEmailVerificationParams = {
  locale: LocaleCode;
  emailVerificationCode: string;
};

const render = ({ locale, emailVerificationCode }: RenderEmailVerificationParams) => {
  const t = locales[locale].email_verification;
  const subject = t.subject;
  const link = getLocaleBaseUrl(locale) + '/verify-email?code=' + emailVerificationCode;
  const contentHtml = substitute(t.click_to_verify, { link });

  return {
    subject,
    html: renderBrandedEmail({ title: subject, contentHtml }),
  };
};

export default render;
