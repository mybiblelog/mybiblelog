import fs from 'node:fs';
import path from 'node:path';
import useRepositories from '../../repositories/useRepositories';
import { LocaleCode } from '@mybiblelog/shared';
import renderEmailVerification from './email-templates/email-verification';
import renderPasswordResetLink from './email-templates/password-reset-link';
import renderEmailUpdate from './email-templates/email-update';
import renderExistingAccountNotice from './email-templates/existing-account-notice';
import renderNewFeedbackNotification from './email-templates/new-feedback-notification';
import { brandLogoCid } from './email-templates/branded-wrapper';

import { QueueEmailParams, SendEmailParams } from './email-types';
import sendEmail from './email-senders/resend';
import { createQueue } from './email-queue';
import { getConfig } from '../../config';

type Attachment = NonNullable<SendEmailParams['attachments']>[number];

export type EmailService = {
  send: (params: QueueEmailParams) => void;
  // The `queue*` helpers only enqueue an email and return synchronously; the
  // actual send happens off the queue (see `createQueue`/`sendFn`). They are
  // intentionally not async — callers do not wait for delivery.
  queueUserEmailVerification: (email: string, emailVerificationCode: string, locale: LocaleCode) => void;
  queuePasswordResetLink: (email: string, passwordResetCode: string, locale: LocaleCode) => void;
  queueEmailUpdateLink: (currentEmail: string, newEmail: string, newEmailVerificationCode: string, locale: LocaleCode) => void;
  queueExistingAccountNotice: (email: string, locale: LocaleCode) => void;
  queueNewFeedbackNotification: (adminEmail: string, feedback: { kind: string; email: string; message: string }) => void;
};

const init = async () => {
  const { emailSendingDomain, siteUrl, nodeEnv } = getConfig();
  const defaultFromEmailAddress = `My Bible Log <team@${emailSendingDomain}>`;
  const defaultReplyToEmailAddress = `My Bible Log <team@${emailSendingDomain}>`;
  const { emails } = await useRepositories();

  let cachedBrandLogoAttachment: Attachment | null | undefined;
  const getBrandLogoAttachment = (): Attachment | undefined => {
    if (cachedBrandLogoAttachment !== undefined) {
      return cachedBrandLogoAttachment || undefined;
    }

    try {
      const brandLogoAssetPath = path.resolve(__dirname, 'assets', 'brand.png');
      if (!fs.existsSync(brandLogoAssetPath)) {
        cachedBrandLogoAttachment = null;
        return undefined;
      }

      cachedBrandLogoAttachment = {
        filename: 'brand.png',
        content: fs.readFileSync(brandLogoAssetPath),
        contentId: brandLogoCid,
      };
      return cachedBrandLogoAttachment;
    }
    catch {
      cachedBrandLogoAttachment = null;
      return undefined;
    }
  };

  const sendFn = async (params: SendEmailParams): Promise<void> => {
    let status: 'pending' | 'sent' | 'failed' | 'log_only' = 'pending';

    // only send email in production
    if (nodeEnv === 'production') {
      try {
        await sendEmail(params);
        status = 'sent';
        console.log('Email sent successfully');
      }
      catch (error) {
        status = 'failed';
        console.error('Email failed:', error);
      }
    }
    else {
      status = 'log_only';
      console.log('Email logged successfully');
    }

    // record email, but do not block with `await`
    const { attachments: _attachments, ...forRecord } = params;
    emails.create({ ...forRecord, status });
  };

  // Outside production nothing is actually sent (emails are recorded as
  // `log_only`), so skip the provider-rate-limit pacing — a backlog would
  // delay recording and starve the test email seam (`GET /api/test/emails`).
  const { enqueue } = createQueue<SendEmailParams>(sendFn, nodeEnv === 'production' ? undefined : 0);

  const queueEmail = (params: QueueEmailParams): void => {
    const from = params.from || defaultFromEmailAddress;
    const replyTo = params.replyTo || defaultReplyToEmailAddress;
    const normalized: SendEmailParams = { ...params, from, replyTo };

    // If we're sending HTML, attach the brand logo (if available) so the shared branded
    // wrapper can reference it via `cid:${brandLogoCid}`.
    if ('html' in normalized) {
      const brandLogoAttachment = getBrandLogoAttachment();
      if (brandLogoAttachment) {
        const existingAttachments = normalized.attachments || [];
        const alreadyHasBrandLogo = existingAttachments.some((a) => a.contentId === brandLogoCid);
        if (!alreadyHasBrandLogo) {
          normalized.attachments = [...existingAttachments, brandLogoAttachment];
        }
      }
    }
    enqueue(normalized);
  };

  const queueUserEmailVerification = (email: string, emailVerificationCode: string, locale: LocaleCode = 'en'): void => {
    const { subject, html } = renderEmailVerification({ locale, email, emailVerificationCode });

    queueEmail({
      from: defaultFromEmailAddress,
      to: email,
      subject,
      html,
    });
  };

  const queuePasswordResetLink = (email: string, passwordResetCode: string, locale: LocaleCode = 'en'): void => {
    const { subject, html } = renderPasswordResetLink({ locale, email, passwordResetCode });

    queueEmail({
      from: defaultFromEmailAddress,
      to: email,
      subject,
      html,
    });
  };

  const queueEmailUpdateLink = (currentEmail: string, newEmail: string, newEmailVerificationCode: string, locale: LocaleCode = 'en'): void => {
    const { subject, html } = renderEmailUpdate({ locale, currentEmail, newEmail, newEmailVerificationCode });

    queueEmail({
      from: defaultFromEmailAddress,
      to: newEmail,
      subject,
      html,
      attachments: [],
    });
  };

  const queueExistingAccountNotice = (email: string, locale: LocaleCode = 'en'): void => {
    const { subject, html } = renderExistingAccountNotice({ locale });

    queueEmail({
      from: defaultFromEmailAddress,
      to: email,
      subject,
      html,
    });
  };

  const queueNewFeedbackNotification = (adminEmail: string, feedback: { kind: string; email: string; message: string }): void => {
    const adminFeedbackUrl = new URL('/admin/feedback', siteUrl).toString();
    const { subject, html } = renderNewFeedbackNotification({ adminFeedbackUrl, ...feedback });

    queueEmail({
      from: defaultFromEmailAddress,
      to: adminEmail,
      subject,
      html,
    });
  };

  return {
    send: queueEmail,
    queueUserEmailVerification,
    queuePasswordResetLink,
    queueEmailUpdateLink,
    queueExistingAccountNotice,
    queueNewFeedbackNotification,
  };
};

let emailService: EmailService;

const useEmailService: () => Promise<EmailService> = async () => {
  if (!emailService) {
    emailService = await init();
  }
  return emailService;
};

export default useEmailService;
