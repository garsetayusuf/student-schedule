import { z } from 'zod';
import { localDateTimeSchema, recurrenceSchema } from './create-event.dto.js';

export const patchEventSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    subjectId: z.string().uuid().nullable().optional(),
    start: localDateTimeSchema.optional(),
    end: localDateTimeSchema.optional(),
    timeZone: z.string().min(1).optional(),
    recurrence: recurrenceSchema.nullable().optional(),
  })
  .strict();

export type PatchEventDto = z.infer<typeof patchEventSchema>;
