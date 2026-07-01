import renderBrandedEmail from './branded-wrapper';

type RenderNewFeedbackNotificationParams = {
  adminFeedbackUrl: string;
  kind: string;
  email: string;
  message: string;
};

// The feedback fields are free-text user input; escape them before embedding
// in HTML so a submission can't inject markup into the admin's inbox.
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/**
 * Internal admin notification, not user-facing, so it isn't localized like the
 * other templates.
 */
const render = ({ adminFeedbackUrl, kind, email, message }: RenderNewFeedbackNotificationParams) => {
  const subject = 'New feedback submitted';

  const contentHtml = (`
    <p class="text-centered">New feedback has been submitted.</p>
    <p><strong>Kind:</strong> ${escapeHtml(kind)}</p>
    <p><strong>From:</strong> ${escapeHtml(email)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(message)}</p>
    <p class="cta-container text-centered">
      <a class="cta-button" href="${adminFeedbackUrl}">
        Review feedback
      </a>
    </p>
  `);

  return {
    subject,
    html: renderBrandedEmail({ title: subject, contentHtml }),
  };
};

export default render;
