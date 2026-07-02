import { translateApiError } from './translateApiError';

// A fake translator that echoes the key + interpolation so we can assert what
// was passed without depending on real translation strings.
const t = jest.fn(
  (key: string, options?: Record<string, unknown>) =>
    `${key}${options ? `:${JSON.stringify(options)}` : ''}`,
) as any;

beforeEach(() => t.mockClear());

describe('translateApiError', () => {
  it('maps a known code to its message key', () => {
    const out = translateApiError(t, { field: null, code: 'invalid_login' });
    expect(t).toHaveBeenCalledWith('api_error_invalid_login', { field: undefined });
    expect(out).toContain('api_error_invalid_login');
  });

  it('passes field and properties through for interpolation', () => {
    translateApiError(t, {
      field: 'password',
      code: 'min_length',
      properties: { minlength: 8 },
    });
    expect(t).toHaveBeenCalledWith('api_error_min_length', {
      field: 'password',
      minlength: 8,
    });
  });

  it('returns null for an unknown code', () => {
    expect(translateApiError(t, { field: null, code: 'totally_made_up' })).toBeNull();
    expect(t).not.toHaveBeenCalled();
  });
});
