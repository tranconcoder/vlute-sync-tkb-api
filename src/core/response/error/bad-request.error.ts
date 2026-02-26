import { HttpStatus } from '@nestjs/common';
import { ErrorResponse } from './error.response';

export class BadRequestError extends ErrorResponse {
  constructor(message = 'Bad Request', metadata?: Record<string, any>) {
    super({ message, statusCode: HttpStatus.BAD_REQUEST, metadata });
  }
}
