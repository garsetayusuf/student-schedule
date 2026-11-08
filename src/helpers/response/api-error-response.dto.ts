import type { SchemaObject } from '@nestjs/swagger';

export const apiErrorResponseOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: {
    error: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          enum: [
            'unauthorized',
            'not_found',
            'validation_error',
            'internal_error',
          ],
        },
        message: { type: 'string' },
        fields: {
          type: 'object',
          additionalProperties: { type: 'string' },
        },
      },
      required: ['code', 'message'],
    },
  },
  required: ['error'],
};
