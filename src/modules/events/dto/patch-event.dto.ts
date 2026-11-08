import { z } from 'zod';
import { localDateTimeSchema } from './create-event.dto.js';

export const patchEventSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    subjectId: z.string().uuid().nullable().optional(),
    start: localDateTimeSchema.optional(),
    end: localDateTimeSchema.optional(),
    timeZone: z.string().min(1).optional(),
  })
  .strict();

export type PatchEventDto = z.infer<typeof patchEventSchema>;
