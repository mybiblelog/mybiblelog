import { LocaleCode } from '@shared/dist/platform/i18n';
import locales from '../locales/content';
import { substitute } from '../locales/substitute';
import renderBrandedEmail from './branded-wrapper';

type RenderDailyReminderEmailParams = {
  siteLink: string;
  settingsLink: string;
  unsubscribeLink: string;
  recentLogEntries: { displayDate: string, passage: string }[];
  emailDate: Date;
  locale: LocaleCode;
};

const render = ({
  siteLink,
  settingsLink,
  unsubscribeLink,
  recentLogEntries,
  emailDate,
  locale,
}: RenderDailyReminderEmailParams) => {
  const t = locales[locale].daily_reminder;
  const dateFormatOptions: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
  const subjectDate = new Intl.DateTimeFormat(locale, dateFormatOptions).format(emailDate);
  const subject = substitute(t.subject, { subjectDate });

  /* eslint-disable indent */
  const recentLogEntriesRowsHtml = recentLogEntries.length > 0
    ? recentLogEntries.map((logEntry) => (`
        <tr>
          <td>${logEntry.displayDate}</td>
          <td>${logEntry.passage}</td>
        </tr>
      `)).join('')
    : `<tr><td colspan="2">${t.no_log_entries_found}</td></tr>`;

  const contentHtml = (`
    <p class="text-centered">${t.this_is_your_reminder}</p>
    <p class="text-centered">${substitute(t.you_can_update_preferences, { settingsLink })}</p>
    <p class="cta-container text-centered">
      <a class="cta-button" href="${siteLink}">
        ${t.open_my_bible_log}
      </a>
    </p>
    <p><strong>${t.most_recent_log_entries}</strong></p>
    <table class="log-entry-table" border="0" cellpadding="5" cellspacing="0" width="100%">
      <thead>
        <tr>
          <th>${t.date}</th>
          <th>${t.passage}</th>
        </tr>
      </thead>
      <tbody>
        ${recentLogEntriesRowsHtml}
      </tbody>
    </table>
  `);

  const footerHtml = `<p><a href="${unsubscribeLink}">${t.unsubscribe}</a></p>`;
  /* eslint-enable indent */

  const html = renderBrandedEmail({ title: subject, contentHtml, footerHtml });
  return {
    subject,
    html,
  };
};

export default render;
