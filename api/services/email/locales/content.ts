import { LocaleCode } from '@mybiblelog/shared';
import strings from './strings.json';

export type Translation = {
  daily_reminder: {
    subject: string;
    my_bible_log: string;
    this_is_your_reminder: string;
    you_can_update_preferences: string;
    open_my_bible_log: string;
    most_recent_log_entries: string;
    no_log_entries_found: string;
    date: string;
    passage: string;
    unsubscribe: string;
  },
  email_update: {
    subject: string;
    email_update_requested: string;
    click_to_confirm: string;
    enter_code: string;
    if_you_did_not_request: string;
  },
  email_verification: {
    subject: string;
    click_to_verify: string;
    enter_code: string;
  },
  password_reset: {
    subject: string;
    click_to_reset: string;
    enter_code: string;
  },
  existing_account: {
    subject: string;
    body: string;
  },
};

export type Locales = Record<LocaleCode, Translation>;

export default strings satisfies Locales;
