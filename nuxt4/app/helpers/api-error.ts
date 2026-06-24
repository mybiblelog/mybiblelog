export type ApiErrorDetail = {
  /**
   * Field name for field-level errors. Set to `null` for top-level errors.
   */
  field: string | null;
  /**
   * Machine-readable i18n-friendly code.
   */
  code: string;
  /**
   * Optional metadata for the error.
   */
  properties?: Record<string, unknown>;
};

export type ApiErrorPayload = {
  /**
   * Top-level error code.
   */
  code: string;
  /**
   * Optional array of field errors.
   */
  errors?: ApiErrorDetail[];
};

export class ApiError extends Error {
  code: string;
  errors: ApiErrorDetail[];

  constructor(payload: ApiErrorPayload) {
    super(payload.code);

    this.name = 'ApiError';
    this.code = payload.code;
    this.errors = payload.errors ?? [];
  }
}

export class UnknownApiError extends ApiError {
  constructor() {
    super({ code: 'unknown_error', errors: [] });
  }
}
