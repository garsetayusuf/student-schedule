import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { ApiError } from '../../helpers/response/api-error.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { PUBLIC_ROUTE } from '../../decorators/public.decorator.js';
import type { CurrentUser } from '../../interfaces/auth/current-user.interface.js';

type RequestWithUser = FastifyRequest & { user?: CurrentUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];

    if (scheme !== 'Bearer' || !token)
      throw new ApiError('unauthorized', 'Unauthorized', 401);

    const apiToken = await this.prisma.apiToken.findUnique({
      where: { tokenHash: createHash('sha256').update(token).digest('hex') },
      include: { user: { select: { id: true, timeZone: true } } },
    });

    if (!apiToken) throw new ApiError('unauthorized', 'Unauthorized', 401);

    request.user = apiToken.user;
    return true;
  }
}
