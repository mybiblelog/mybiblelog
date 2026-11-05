import type { ApiErrorDetail } from './api-error';

/** Mirrors the API's `feedbackBodySchema` limit on `message`. */
export const FEEDBACK_MESSAGE_MAX_LENGTH = 1500;

export type FeedbackForm = {
  email: string;
  kind: string;
  message: string;
};

/**
 * Client-side validation for the feedback form, mirroring the API's
 * `feedbackBodySchema` so the user gets immediate feedback without a round
 * trip. Errors use the same `ApiErrorDetail` codes the API returns, so the
 * form renders client and server errors identically (via `$terr`). The API
 * remains the source of truth.
 */
export const validateFeedbackForm = (form: FeedbackForm): Record<string, ApiErrorDetail> => {
  const errors: Record<string, ApiErrorDetail> = {};

  const email = form.email.trim();
  if (!email) {
    errors.email = { field: 'email', code: 'required' };
  }
  else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = { field: 'email', code: 'not_valid' };
  }

  const message = form.message.trim();
  if (!message) {
    errors.message = { field: 'message', code: 'required' };
  }
  else if (message.length > FEEDBACK_MESSAGE_MAX_LENGTH) {
    errors.message = { field: 'message', code: 'max_length', properties: { maxlength: FEEDBACK_MESSAGE_MAX_LENGTH } };
  }

  return errors;
};
