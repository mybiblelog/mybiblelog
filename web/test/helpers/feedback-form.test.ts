import { describe, it, expect, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import type { ApiErrorDetail } from '~/helpers/api-error';
import {
  FEEDBACK_MESSAGE_MAX_LENGTH,
  clearFeedbackErrorsOnEdit,
  makeFeedbackFieldError,
  validateFeedbackForm,
} from '~/helpers/feedback-form';

const valid = { email: 'reader@example.com', kind: 'bug', message: 'Something is broken' };

describe('validateFeedbackForm', () => {
  it('returns no errors for a valid form', () => {
    expect(validateFeedbackForm(valid)).toEqual({});
  });

  it('requires a non-blank message', () => {
    expect(validateFeedbackForm({ ...valid, message: '' })).toEqual({
      message: { field: 'message', code: 'required' },
    });
    expect(validateFeedbackForm({ ...valid, message: '  \n ' })).toEqual({
      message: { field: 'message', code: 'required' },
    });
  });

  it('rejects a message over the maximum length', () => {
    expect(validateFeedbackForm({ ...valid, message: 'a'.repeat(FEEDBACK_MESSAGE_MAX_LENGTH + 1) })).toEqual({
      message: { field: 'message', code: 'max_length', properties: { maxlength: FEEDBACK_MESSAGE_MAX_LENGTH } },
    });
  });

  it('measures the message length after trimming, like the API', () => {
    const message = ` ${'a'.repeat(FEEDBACK_MESSAGE_MAX_LENGTH)} `;
    expect(validateFeedbackForm({ ...valid, message })).toEqual({});
  });

  it('requires an email', () => {
    expect(validateFeedbackForm({ ...valid, email: ' ' })).toEqual({
      email: { field: 'email', code: 'required' },
    });
  });

  it('rejects a malformed email', () => {
    expect(validateFeedbackForm({ ...valid, email: 'not-an-email' })).toEqual({
      email: { field: 'email', code: 'not_valid' },
    });
  });

  it('reports every invalid field at once', () => {
    expect(Object.keys(validateFeedbackForm({ ...valid, email: '', message: '' }))).toEqual(['email', 'message']);
  });
});

describe('makeFeedbackFieldError', () => {
  const t = (key: string) => `local:${key}`;
  const terr = vi.fn((detail: string | ApiErrorDetail) => `api:${typeof detail === 'string' ? detail : detail.code}`);

  it('uses the form-specific translation when one exists', () => {
    const fieldError = makeFeedbackFieldError(t, key => key === 'message_required', terr);
    expect(fieldError({ field: 'message', code: 'required' })).toBe('local:message_required');
  });

  it('falls back to the generic API error translation', () => {
    const fieldError = makeFeedbackFieldError(t, () => false, terr);
    expect(fieldError({ field: 'message', code: 'max_length' })).toBe('api:max_length');
  });
});

describe('clearFeedbackErrorsOnEdit', () => {
  it('clears only the edited field\'s error', async () => {
    const form = ref({ ...valid });
    const errors = ref<Record<string, ApiErrorDetail>>({
      email: { field: 'email', code: 'not_valid' },
      message: { field: 'message', code: 'required' },
    });
    clearFeedbackErrorsOnEdit(form, errors);

    form.value.message = 'edited';
    await nextTick();
    expect(Object.keys(errors.value)).toEqual(['email']);
  });
});
