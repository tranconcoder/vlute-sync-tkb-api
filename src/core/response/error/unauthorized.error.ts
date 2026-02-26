import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from './error.response';

export class UnauthorizedError extends ErrorResponse {
  constructor(message = 'Unauthorized', metadata?: Record<string, any>) {
    super({ message, statusCode: HttpStatus.UNAUTHORIZED, metadata });
  }
}
