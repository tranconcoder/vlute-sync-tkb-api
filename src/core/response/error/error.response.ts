import { HttpException, HttpStatus } from '@nestjs/common';

export class ErrorResponse extends HttpException {
  constructor({
    message = 'Error',
    statusCode = HttpStatus.INTERNAL_SERVER_ERROR,
    metadata,
  }: {
    message?: string;
    statusCode?: number;
    metadata?: Record<string, any>;
  }) {
    super(
      {
        success: false,
        statusCode,
        message,
        metadata,
      },
      statusCode,
    );
  }
}
