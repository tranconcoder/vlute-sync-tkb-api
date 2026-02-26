import { HttpStatus } from '@nestjs/common';
import { SuccessResponse } from './success.response';

export class OkResponse<T = any> extends SuccessResponse<T> {
  constructor({
    message = 'OK',
    data,
    metadata,
  }: {
    message?: string;
    data?: T;
    metadata?: Record<string, any>;
  } = {}) {
    super({ message, statusCode: HttpStatus.OK, data, metadata });
  }
}
