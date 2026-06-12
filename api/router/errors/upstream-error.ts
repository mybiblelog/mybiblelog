import { AppError } from './app-error';
import { ApiErrorCode } from './error-codes';

/**
 * Represents a failure of an upstream service the API depends on
 * (e.g. an external Bible text provider).
 *
 * Reuses the `internal_server_error` code so no new ApiErrorCode
 * (and matching locale strings) is required; clients only need to
 * show a generic failure message.
 */
export class UpstreamServiceError extends AppError {
  status = 502;
  code = ApiErrorCode.InternalServerError;

  constructor() {
    super('Upstream service error');
  }
}
