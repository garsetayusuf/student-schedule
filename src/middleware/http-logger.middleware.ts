import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RequestWithId } from '../helpers/response/response.interceptor.js';

@Injectable()
export class HttpLoggerMiddleware {
  private readonly logger = new Logger(HttpLoggerMiddleware.name);

  onRequest(
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void,
  ): void {
    const requestWithId = request as RequestWithId;
    const requestIdHeader = request.headers['x-request-id'];
    const requestId = Array.isArray(requestIdHeader)
      ? requestIdHeader[0]
      : requestIdHeader;
    requestWithId.requestId = requestId || randomUUID();
    requestWithId.startedAt = Date.now();
    reply.header('x-request-id', requestWithId.requestId);
    done();
  }

  onResponse(
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void,
  ): void {
    const requestWithId = request as RequestWithId;
    this.logger.log(
      JSON.stringify({
        event: 'http.request.completed',
        requestId: requestWithId.requestId,
        method: request.method,
        path: request.url,
        statusCode: reply.statusCode,
        durationMs: Date.now() - (requestWithId.startedAt ?? Date.now()),
      }),
    );
    done();
  }
}
