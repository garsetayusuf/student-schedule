import { describe, expect, it } from 'vitest';
import { createSubjectSchema } from '../../src/modules/subjects/dto/create-subject.dto.js';

describe('createSubjectSchema', () => {
  it('accepts the documented boundaries', () => {
    expect(createSubjectSchema.safeParse({ name: 'a' }).success).toBe(true);
    expect(
      createSubjectSchema.safeParse({ name: 'a'.repeat(100), color: '#A1b2C3' })
        .success,
    ).toBe(true);
  });

  it('rejects invalid names, colors, and unknown fields', () => {
    expect(createSubjectSchema.safeParse({ name: '' }).success).toBe(false);
    expect(
      createSubjectSchema.safeParse({ name: 'a'.repeat(101) }).success,
    ).toBe(false);
    expect(
      createSubjectSchema.safeParse({ name: 'Biology', color: 'blue' }).success,
    ).toBe(false);
    expect(
      createSubjectSchema.safeParse({ name: 'Biology', extra: true }).success,
    ).toBe(false);
  });
});
