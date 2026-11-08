import { describe, expect, it, vi } from 'vitest';
import { AuthGuard } from '../../src/modules/auth/auth.guard.js';
import { ApiError } from '../../src/helpers/response/api-error.js';

const context = (authorization?: string) =>
  ({
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization } }),
    }),
  }) as never;

describe('AuthGuard', () => {
  it('rejects a missing bearer token', async () => {
    const guard = new AuthGuard(
      { getAllAndOverride: vi.fn().mockReturnValue(false) } as never,
      { apiToken: { findUnique: vi.fn() } } as never,
    );
    await expect(guard.canActivate(context())).rejects.toBeInstanceOf(ApiError);
  });

  it('attaches the user for a valid token', async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValue({ user: { id: 'alice', timeZone: 'Asia/Jakarta' } });
    const request = { headers: { authorization: 'Bearer token-alice' } };
    const ctx = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as never;
    const guard = new AuthGuard(
      { getAllAndOverride: vi.fn().mockReturnValue(false) } as never,
      { apiToken: { findUnique } } as never,
    );
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request).toHaveProperty('user', {
      id: 'alice',
      timeZone: 'Asia/Jakarta',
    });
    expect(findUnique).toHaveBeenCalledOnce();
  });
});
