import { z } from 'zod';

export const listEventsSchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict()
  .refine((value) => value.to >= value.from, {
    path: ['to'],
    message: 'Must not be before from',
  });

export type ListEventsDto = z.infer<typeof listEventsSchema>;
