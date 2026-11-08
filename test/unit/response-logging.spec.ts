import { describe, expect, it, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { ResponseInterceptor } from '../../src/helpers/response/response.interceptor.js';
import { HttpLoggerMiddleware } from '../../src/middleware/http-logger.middleware.js';

describe('response and request logging', () => {
  it('wraps plain handler values in the application response envelope', async () => {
    const interceptor = new ResponseInterceptor();
    const result = await firstValueFrom(
      interceptor.intercept(
        {
          switchToHttp: () => ({ getResponse: () => ({ statusCode: 200 }) }),
        } as never,
        { handle: () => of({ id: 'subject-1' }) } as never,
      ),
    );
    expect(result).toEqual({ data: { id: 'subject-1' } });
  });

  it('does not double-wrap an existing envelope or a 204 response', async () => {
    const interceptor = new ResponseInterceptor();
    const existing = await firstValueFrom(
      interceptor.intercept(
        {
          switchToHttp: () => ({ getResponse: () => ({ statusCode: 200 }) }),
        } as never,
        { handle: () => of({ data: [] }) } as never,
      ),
    );
    const empty = await firstValueFrom(
      interceptor.intercept(
        {
          switchToHttp: () => ({ getResponse: () => ({ statusCode: 204 }) }),
        } as never,
        { handle: () => of(undefined) } as never,
      ),
    );
    expect(existing).toEqual({ data: [] });
    expect(empty).toBeUndefined();
  });

  it('assigns an id and emits a structured completion log', () => {
    const logger = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
    const middleware = new HttpLoggerMiddleware();
    const request = { method: 'GET', url: '/healthz', headers: {} };
    const reply = { statusCode: 200, header: vi.fn() };
    middleware.onRequest(request as never, reply as never, vi.fn());
    middleware.onSend(request as never, reply as never, '{"data":{}}', vi.fn());
    expect(reply.header).toHaveBeenCalledWith(
      'x-request-id',
      expect.any(String),
    );
    expect(logger).toHaveBeenCalledWith(
      expect.stringContaining('http.response.completed'),
    );
    logger.mockRestore();
  });
});
