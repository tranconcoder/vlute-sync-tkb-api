import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from './error.response';

export class NotFoundError extends ErrorResponse {
  constructor(message = 'Not Found', metadata?: Record<string, any>) {
    super({ message, statusCode: HttpStatus.NOT_FOUND, metadata });
  }
}
