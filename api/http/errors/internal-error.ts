import { AppError } from './app-error';
import { ApiErrorCode } from './error-codes';

export class InternalError extends AppError {
  status = 500;
  code = ApiErrorCode.InternalServerError;

  constructor() {
    super('Internal server error');
  }
}
