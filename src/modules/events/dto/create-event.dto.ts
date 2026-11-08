import { z } from 'zod';

export const localDateTimeSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);

const eventFieldsSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    subjectId: z.string().uuid().nullable().optional(),
    start: localDateTimeSchema,
    end: localDateTimeSchema,
    timeZone: z.string().min(1),
  })
  .strict();

export const createEventSchema = eventFieldsSchema.refine(
  (value) => value.end > value.start,
  {
    path: ['end'],
    message: 'Must be after start',
  },
);

export type CreateEventDto = z.infer<typeof createEventSchema>;
