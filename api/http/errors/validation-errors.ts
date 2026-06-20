import { AppError } from './app-error';
import { ApiErrorCode } from './error-codes';
import { ApiErrorDetail } from '../response';

export class ValidationError extends AppError {
  status = 400;
  code = ApiErrorCode.ValidationError;

  constructor(details?: ApiErrorDetail[]) {
    super('Validation failed', details);
  }
}
