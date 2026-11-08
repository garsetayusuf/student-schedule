import type { SchemaObject } from '@nestjs/swagger';

export const healthResponseOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: {
    data: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        database: { type: 'string', example: 'up' },
      },
      required: ['status', 'database'],
    },
  },
  required: ['data'],
};
