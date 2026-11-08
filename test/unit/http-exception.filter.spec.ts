import { describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from '../../src/interceptors/http-exception.filter.js';
import { ApiError } from '../../src/helpers/response/api-error.js';

describe('HttpExceptionFilter', () => {
  it('maps unexpected errors without exposing stack details', () => {
    const reply = vi.fn();
    const filter = new HttpExceptionFilter({ httpAdapter: { reply } } as never);
    filter.catch(new Error('database secret'), {
      switchToHttp: () => ({ getResponse: () => ({}) }),
    } as never);
    expect(reply).toHaveBeenCalledWith(
      {},
      { error: { code: 'internal_error', message: 'Internal server error' } },
      500,
    );
  });

  it('preserves structured API errors and fields', () => {
    const reply = vi.fn();
    const filter = new HttpExceptionFilter({ httpAdapter: { reply } } as never);
    filter.catch(
      new ApiError('validation_error', 'Validation failed', 422, {
        end: 'Must be after start',
      }),
      { switchToHttp: () => ({ getResponse: () => ({}) }) } as never,
    );
    expect(reply).toHaveBeenCalledWith(
      {},
      {
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          fields: { end: 'Must be after start' },
        },
      },
      422,
    );
  });
});
