import { HttpStatus } from '@nestjs/common';

export class SuccessResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  metadata?: Record<string, any>;

  constructor({
    message = 'Success',
    statusCode = HttpStatus.OK,
    data,
    metadata,
  }: {
    message?: string;
    statusCode?: number;
    data?: T;
    metadata?: Record<string, any>;
  }) {
    this.success = true;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.metadata = metadata;
  }
}
