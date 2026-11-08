import 'dotenv/config';
import { StandardSchemaValidationPipe, type LogLevel } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import type { AppConfig } from './config/env.schema.js';
import { setupSwagger } from './config/swagger.config.js';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware.js';

async function bootstrap(): Promise<void> {
  const logger = process.env.LOG_LEVEL
    ? [process.env.LOG_LEVEL as LogLevel]
    : undefined;
  const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
    logger,
  });
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableCors({
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  const httpLogger = app.get(HttpLoggerMiddleware);
  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onRequest', httpLogger.onRequest.bind(httpLogger));
  fastify.addHook('preHandler', httpLogger.preHandler.bind(httpLogger));
  fastify.addHook('onSend', httpLogger.onSend.bind(httpLogger));
  const config = app.get(ConfigService<AppConfig, true>);
  setupSwagger(app);
  await app.listen(config.getOrThrow('PORT', { infer: true }), '0.0.0.0');
}

await bootstrap();
