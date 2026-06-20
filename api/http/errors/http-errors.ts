import { AppError } from './app-error';
import { ApiErrorCode } from './error-codes';
import { ApiErrorDetail } from '../response';

export class UnauthenticatedError extends AppError {
  status = 401;
  code = ApiErrorCode.Unauthenticated;

  constructor(details?: ApiErrorDetail[]) {
    super('Authentication required', details);
  }
}

export class UnauthorizedError extends AppError {
  status = 403;
  code = ApiErrorCode.Unauthorized;

  constructor(details?: ApiErrorDetail[]) {
    super('Forbidden', details);
  }
}

export class InvalidRequestError extends AppError {
  status = 400;
  code = ApiErrorCode.InvalidRequest;

  constructor(details?: ApiErrorDetail[]) {
    super('Invalid request', details);
  }
}

export class NotFoundError extends AppError {
  status = 404;
  code = ApiErrorCode.NotFound;

  constructor(details?: ApiErrorDetail[]) {
    super('Not found', details);
  }
}

export class TooManyRequestsError extends AppError {
  status = 429;
  code = ApiErrorCode.TooManyRequests;

  constructor(details?: ApiErrorDetail[]) {
    super('Too many requests', details);
  }
}
