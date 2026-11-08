import { Controller, Get } from '@nestjs/common';
import { ApiErrorResponses } from '../../decorators/api-error-responses.decorator.js';
import { ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../../decorators/public.decorator.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import { healthResponseOpenApiSchema } from './dto/health-response.dto.js';

@Controller('healthz')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Public()
  @ApiOkResponse({ schema: healthResponseOpenApiSchema })
  @ApiErrorResponses(500)
  async check() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { data: { status: 'ok', database: 'up' } };
  }
}
