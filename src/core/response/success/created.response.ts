import { HttpStatus } from '@nestjs/common';
import { SuccessResponse } from './success.response';

export class CreatedResponse<T = any> extends SuccessResponse<T> {
  constructor({
    message = 'Created',
    data,
    metadata,
  }: {
    message?: string;
    data?: T;
    metadata?: Record<string, any>;
  } = {}) {
    super({ message, statusCode: HttpStatus.CREATED, data, metadata });
  }
}
