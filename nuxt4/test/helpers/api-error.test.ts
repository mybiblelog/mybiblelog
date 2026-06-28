import { describe, it, expect } from 'vitest';
import { ApiError, UnknownApiError } from '~/helpers/api-error';

describe('ApiError', () => {
  it('is an Error with name "ApiError" and the payload code as message', () => {
    const err = new ApiError({ code: 'bad_request' });
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('bad_request');
    expect(err.code).toBe('bad_request');
  });

  it('defaults errors to an empty array when omitted', () => {
    expect(new ApiError({ code: 'x' }).errors).toEqual([]);
  });

  it('retains provided field errors', () => {
    const errors = [{ field: 'email', code: 'invalid' }];
    expect(new ApiError({ code: 'validation', errors }).errors).toEqual(errors);
  });
});

describe('UnknownApiError', () => {
  it('is an ApiError with the unknown_error code and no field errors', () => {
    const err = new UnknownApiError();
    expect(err).toBeInstanceOf(ApiError);
    expect(err.code).toBe('unknown_error');
    expect(err.errors).toEqual([]);
  });
});
