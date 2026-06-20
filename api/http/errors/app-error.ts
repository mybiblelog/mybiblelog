import { ApiErrorDetail } from '../response';
import { type ApiErrorCode } from './error-codes';

/**
 * Represents a base error class for all application errors.
 */
export abstract class AppError extends Error {
  abstract readonly status: number;
  abstract readonly code: ApiErrorCode;
  readonly details?: ApiErrorDetail[];

  constructor(message?: string, details?: ApiErrorDetail[]) {
    super(message);
    this.details = details;
  }
}
