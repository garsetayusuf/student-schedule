import type { SchemaObject } from '@nestjs/swagger';

export const subjectResponseOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    userId: { type: 'string', format: 'uuid' },
    name: { type: 'string' },
    color: { type: 'string', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'userId', 'name', 'color', 'createdAt'],
};

export const subjectEnvelopeOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: { data: subjectResponseOpenApiSchema },
  required: ['data'],
};

export const subjectListEnvelopeOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: { data: { type: 'array', items: subjectResponseOpenApiSchema } },
  required: ['data'],
};
