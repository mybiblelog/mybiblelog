import { LocaleCode } from '@shared/dist/platform/i18n';
import { getConfig } from '../../../config';

export const getLocaleBaseUrl = (locale: LocaleCode) => {
  const localePathSegment = locale === 'en' ? '' : '/' + locale;
  return getConfig().siteUrl + localePathSegment;
};

// Styling for code emails lives inline: many clients (notably Gmail) strip or
// ignore <head><style>, so classes defined in the branded wrapper's head aren't
// reliable here.

// Slightly larger body copy so the surrounding instructions read comfortably
// next to the enlarged code block.
export const emailParagraphStyle = 'font-size:18px;line-height:1.5;margin:0 0 16px;';

// Renders the one-time code as the visual focal point of the email: its own line,
// centered, large, and boxed so it's easy to read and copy.
export const renderCodeBlock = (code: string) => (
  `<div style="font-size:34px;font-weight:700;letter-spacing:6px;text-align:center;`
  + `font-family:'Courier New',monospace;color:#1f3d7a;background:#f1f4fb;`
  + `border:1px solid #d3dcf0;border-radius:8px;padding:18px 12px;margin:20px 0;">`
  + `${code}</div>`
);
