import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Student Schedule API')
    .setDescription('Student subjects and time-zone-aware class schedules.')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'Token' })
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  app.use(
    '/api-docs',
    apiReference({
      content: documentFactory(),
      withFastify: true,
      showDeveloperTools: 'never',
      authentication: {
        preferredSecurityScheme: 'bearer',
        createAnySecurityScheme: true,
        securitySchemes: {
          bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'Token' },
        },
      },
    }),
  );
}
