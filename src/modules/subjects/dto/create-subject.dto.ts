import { z } from 'zod';

export const createSubjectSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
  })
  .strict();

export type CreateSubjectDto = z.infer<typeof createSubjectSchema>;
