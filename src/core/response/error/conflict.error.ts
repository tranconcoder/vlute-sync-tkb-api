import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from './error.response';

export class ConflictError extends ErrorResponse {
  constructor(message = 'Conflict', metadata?: Record<string, any>) {
    super({ message, statusCode: HttpStatus.CONFLICT, metadata });
  }
}
