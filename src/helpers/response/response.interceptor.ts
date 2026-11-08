import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import type { FastifyRequest } from 'fastify';
import type { ApiSuccessResponse } from '../dto/base-response.dto.js';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context
      .switchToHttp()
      .getResponse<{ statusCode: number }>();
    return next.handle().pipe(
      map((value: unknown) => {
        if (response.statusCode === 204) return undefined;
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          'data' in value
        ) {
          return value as ApiSuccessResponse<unknown>;
        }
        return { data: value ?? null };
      }),
    );
  }
}

export type RequestWithId = FastifyRequest & {
  requestId?: string;
  startedAt?: number;
};
