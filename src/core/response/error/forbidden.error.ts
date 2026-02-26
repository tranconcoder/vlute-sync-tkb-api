import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from './error.response';

export class ForbiddenError extends ErrorResponse {
  constructor(message = 'Forbidden', metadata?: Record<string, any>) {
    super({ message, statusCode: HttpStatus.FORBIDDEN, metadata });
  }
}
