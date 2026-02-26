export interface IResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  metadata?: Record<string, any>;
}

export { SuccessResponse, OkResponse, CreatedResponse } from './success';
export {
  ErrorResponse,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from './error';
