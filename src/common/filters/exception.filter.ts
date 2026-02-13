import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../dto/api-response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const statusCode = exception?.getStatus?.() ?? 500;
    if (statusCode >= 500) {
      const error = exception as unknown as Error;
      console.error(error?.stack || error);
    }

    // Handle Validation Errors from class-validator
    if (exception instanceof BadRequestException) {
      const validationErrors = exception.getResponse() as any;
      const errors = validationErrors?.message ?? 'Bad Request Exception';

      return response.status(400).json(new ApiResponse(false, 400, errors));
    }

    const message = exception?.message || 'Internal server error';

    response.status(statusCode).json(new ApiResponse(false, statusCode, message));
  }
}
