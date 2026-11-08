import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { CurrentUser as CurrentUserData } from '../interfaces/auth/current-user.interface.js';

type RequestWithUser = FastifyRequest & { user: CurrentUserData };

export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): CurrentUserData =>
    context.switchToHttp().getRequest<RequestWithUser>().user,
);
