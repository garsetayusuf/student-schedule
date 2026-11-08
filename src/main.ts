import { StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import type { AppConfig } from './config/env.schema.js';
import { setupSwagger } from './config/swagger.config.js';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
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
  await app.listen({
    host: '0.0.0.0',
    port: config.getOrThrow('PORT', { infer: true }),
  });
}

await bootstrap();
