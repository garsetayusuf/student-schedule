import type { SchemaObject } from '@nestjs/swagger';

export interface RecurrenceResponseDto {
  weekly: { until: string };
}

export interface EventResponseDto {
  id: string;
  title: string;
  subjectId: string | null;
  start: string;
  end: string;
  timeZone: string;
  recurrence?: RecurrenceResponseDto;
  occurrenceStart?: string;
  startUtc: string;
  endUtc: string;
}

export const recurrenceOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: {
    weekly: {
      type: 'object',
      properties: {
        until: { type: 'string', format: 'date', example: '2026-12-18' },
      },
      required: ['until'],
    },
  },
  required: ['weekly'],
};

export const eventResponseOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    title: { type: 'string' },
    subjectId: { type: 'string', format: 'uuid', nullable: true },
    start: { type: 'string', example: '2026-11-09T08:00' },
    end: { type: 'string', example: '2026-11-09T09:30' },
    timeZone: { type: 'string', example: 'Asia/Jakarta' },
    recurrence: recurrenceOpenApiSchema,
    occurrenceStart: { type: 'string', example: '2026-11-16T08:00' },
    startUtc: { type: 'string', format: 'date-time' },
    endUtc: { type: 'string', format: 'date-time' },
  },
  required: [
    'id',
    'title',
    'subjectId',
    'start',
    'end',
    'timeZone',
    'startUtc',
    'endUtc',
  ],
};

export const eventEnvelopeOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: { data: eventResponseOpenApiSchema },
  required: ['data'],
};

export const eventListEnvelopeOpenApiSchema: SchemaObject = {
  type: 'object',
  properties: { data: { type: 'array', items: eventResponseOpenApiSchema } },
  required: ['data'],
};
