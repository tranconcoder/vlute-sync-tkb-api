import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from './error.response';

export class InternalServerError extends ErrorResponse {
  constructor(
    message = 'Internal Server Error',
    metadata?: Record<string, any>,
  ) {
    super({
      message,
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      metadata,
    });
  }
}
