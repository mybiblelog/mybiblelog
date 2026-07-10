import { describe, it, expect } from 'vitest';
import mapFormErrors from '~/helpers/map-form-errors';
import type { ApiErrorDetail } from '~/helpers/api-error';

describe('mapFormErrors', () => {
  it('falls back to a _form error when there are no field errors', () => {
    expect(mapFormErrors({ code: 'bad_request', errors: [] })).toEqual({
      _form: { field: null, code: 'bad_request' },
    });
  });

  it('falls back to a _form error when errors is undefined', () => {
    expect(mapFormErrors({ code: 'oops' })).toEqual({
      _form: { field: null, code: 'oops' },
    });
  });

  it('buckets field errors by field name', () => {
    const email: ApiErrorDetail = { field: 'email', code: 'invalid' };
    const password: ApiErrorDetail = { field: 'password', code: 'too_short' };
    expect(mapFormErrors({ code: 'validation', errors: [email, password] })).toEqual({
      email,
      password,
    });
  });

  it('routes errors without a field to _form', () => {
    const formLevel: ApiErrorDetail = { field: null, code: 'conflict' };
    expect(mapFormErrors({ code: 'validation', errors: [formLevel] })).toEqual({
      _form: formLevel,
    });
  });

  it('mixes field and form-level errors', () => {
    const email: ApiErrorDetail = { field: 'email', code: 'invalid' };
    const formLevel: ApiErrorDetail = { field: null, code: 'conflict' };
    const result = mapFormErrors({ code: 'validation', errors: [email, formLevel] });
    expect(result.email).toBe(email);
    expect(result._form).toBe(formLevel);
  });

  it('last error wins for a repeated field', () => {
    const first: ApiErrorDetail = { field: 'email', code: 'invalid' };
    const second: ApiErrorDetail = { field: 'email', code: 'taken' };
    expect(mapFormErrors({ code: 'validation', errors: [first, second] })).toEqual({
      email: second,
    });
  });
});
