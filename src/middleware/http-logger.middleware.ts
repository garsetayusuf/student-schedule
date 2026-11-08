import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { JsonTruncator } from 'json-truncator';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RequestWithId } from '../helpers/response/response.interceptor.js';

const REDACTED_VALUE = '[REDACTED]';
const SENSITIVE_KEYS: Record<string, true> = {
  authorization: true,
  cookie: true,
  password: true,
  token: true,
  accesstoken: true,
  refreshtoken: true,
  apikey: true,
  apisecret: true,
};

function redactSensitiveData(value: unknown): unknown {
  if (Array.isArray(value))
    return value.map((item) => redactSensitiveData(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      SENSITIVE_KEYS[key.replace(/[-_]/g, '').toLowerCase()]
        ? REDACTED_VALUE
        : redactSensitiveData(entry),
    ]),
  );
}

@Injectable()
export class HttpLoggerMiddleware {
  private readonly logger = new Logger(HttpLoggerMiddleware.name);

  private logRequest(payload: Record<string, unknown>): void {
    this.logger.log(JSON.stringify(payload));
  }

  private logResponse(payload: Record<string, unknown>): void {
    this.logger.log(JSON.stringify(payload));
  }

  onRequest(
    request: FastifyRequest,
    reply: FastifyReply,
    done: () => void,
  ): void {
    const requestWithId = request as RequestWithId;
    const header = request.headers['x-request-id'];
    requestWithId.requestId =
      (Array.isArray(header) ? header[0] : header) || randomUUID();
    requestWithId.startedAt = Date.now();
    reply.header('x-request-id', requestWithId.requestId);
    done();
  }

  preHandler(
    request: FastifyRequest,
    _reply: FastifyReply,
    done: () => void,
  ): void {
    const requestWithId = request as RequestWithId;
    this.logRequest({
      event: 'http.request.started',
      requestId: requestWithId.requestId,
      method: request.method,
      path: request.url,
      query: redactSensitiveData(request.query),
      body: redactSensitiveData(request.body),
    });
    done();
  }

  onSend(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: unknown,
    done: () => void,
  ): void {
    const requestWithId = request as RequestWithId;
    let parsedPayload = payload;
    if (typeof payload === 'string') {
      try {
        parsedPayload = JSON.parse(payload);
      } catch {
        parsedPayload = payload;
      }
    }
    this.logResponse({
      event: 'http.response.completed',
      requestId: requestWithId.requestId,
      method: request.method,
      path: request.url,
      statusCode: reply.statusCode,
      durationMs: Date.now() - (requestWithId.startedAt ?? Date.now()),
      body: JsonTruncator.truncate(redactSensitiveData(parsedPayload), 5),
    });
    done();
  }
}
