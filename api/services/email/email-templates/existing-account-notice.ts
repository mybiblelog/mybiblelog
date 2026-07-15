import { LocaleCode } from '@shared/dist/platform/i18n';
import locales from '../locales/content';
import { substitute } from '../locales/substitute';
import { getLocaleBaseUrl } from './helpers';
import renderBrandedEmail from './branded-wrapper';

type RenderExistingAccountNoticeParams = {
  locale: LocaleCode;
};

const render = ({ locale }: RenderExistingAccountNoticeParams) => {
  const t = locales[locale].existing_account;
  const subject = t.subject;
  const link = getLocaleBaseUrl(locale) + '/login';
  const contentHtml = substitute(t.body, { link });

  return {
    subject,
    html: renderBrandedEmail({ title: subject, contentHtml }),
  };
};

export default render;
