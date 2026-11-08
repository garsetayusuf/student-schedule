import {
  Catch,
  type ArgumentsHost,
  type ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ApiError } from './api-error.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.adapterHost;
    const context = host.switchToHttp();
    let status = 500;
    let body: {
      error: { code: string; message: string; fields?: Record<string, string> };
    } = {
      error: { code: 'internal_error', message: 'Internal server error' },
    };

    if (exception instanceof ApiError) {
      status = exception.status;
      body = {
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.fields ? { fields: exception.fields } : {}),
        },
      };
    } else if (exception instanceof HttpException) {
      const exceptionStatus = exception.getStatus();
      status = exceptionStatus === 400 ? 422 : exceptionStatus;
      const response = exception.getResponse();
      const messages =
        typeof response === 'object' &&
        response !== null &&
        'message' in response
          ? response.message
          : undefined;
      body = {
        error: {
          code:
            status === 401
              ? 'unauthorized'
              : status === 404
                ? 'not_found'
                : status === 422
                  ? 'validation_error'
                  : 'internal_error',
          message:
            status === 401
              ? 'Unauthorized'
              : status === 404
                ? 'Not found'
                : status === 422
                  ? 'Validation failed'
                  : 'Internal server error',
          ...(Array.isArray(messages)
            ? { fields: { body: messages.join(', ') } }
            : {}),
        },
      };
    }

    httpAdapter.reply(context.getResponse(), body, status);
  }
}
