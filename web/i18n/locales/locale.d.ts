import type { LocaleCode } from '@mybiblelog/shared';

// Keep in sync with api/http/helpers/i18n-errors.js
export type Translation = {
  my_bible_log: string;
  api_error: {
    unknown_error: string;
    validation_error: string;
    required: string;
    is_invalid: string;
    unique: string;
    min_length: string;
    max_length: string;
    review: string;
    not_found: string;
    invalid_login: string;
    verify_email: string;
    new_email_required: string;
    email_in_use: string;
    password_incorrect: string;
    account_not_found: string;
    password_reset_link_expired: string;
    too_many_requests: string;
    invalid_request: string;
    email_not_verified: string;
    verification_code_expired: string;
  };
  reading_suggestion: {
    new_testament: string;
    old_testament: string;
    wisdom: string;
    date_you_read_passage: string;
  };
};

export type Locales = Record<LocaleCode, Translation>;
