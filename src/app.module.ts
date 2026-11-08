import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { HttpExceptionFilter } from './helpers/response/http-exception.filter.js';
import { ResponseInterceptor } from './helpers/response/response.interceptor.js';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware.js';
import { envSchema } from './config/env.schema.js';
import { AuthGuard } from './modules/auth/auth.guard.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { EventsModule } from './modules/events/events.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { SubjectsModule } from './modules/subjects/subjects.module.js';
import { PrismaModule } from './shared/prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (raw) => envSchema.parse(raw),
    }),
    PrismaModule,
    TerminusModule,
    AuthModule,
    SubjectsModule,
    EventsModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useExisting: AuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    HttpLoggerMiddleware,
  ],
})
export class AppModule {}
