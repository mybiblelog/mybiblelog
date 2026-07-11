import { LocaleCode } from '@shared/dist/platform/i18n';
import locales from '../locales/content';
import { substitute } from '../locales/substitute';
import { getLocaleBaseUrl } from './helpers';
import renderBrandedEmail from './branded-wrapper';

type RenderPasswordResetLinkParams = {
  locale: LocaleCode;
  passwordResetLink: string;
};

const render = ({
  locale,
  passwordResetLink,
}: RenderPasswordResetLinkParams) => {
  const t = locales[locale].password_reset;
  const subject = t.subject;
  const link = getLocaleBaseUrl(locale) + '/reset-password?code=' + passwordResetLink;
  const contentHtml = substitute(t.click_to_reset, { link });

  return {
    subject,
    html: renderBrandedEmail({ title: subject, contentHtml }),
  };
};

export default render;
