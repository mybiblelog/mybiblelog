import { describe, it, expect } from 'vitest';
import { FEEDBACK_MESSAGE_MAX_LENGTH, validateFeedbackForm } from '~/helpers/feedback-form';

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
