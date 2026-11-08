import { describe, expect, it } from 'vitest';
import { createEventSchema } from '../../src/modules/events/dto/create-event.dto.js';

describe('createEventSchema', () => {
  const valid = {
    title: 'Biology',
    start: '2026-11-09T08:00',
    end: '2026-11-09T09:00',
    timeZone: 'Asia/Jakarta',
  };

  it('accepts title boundaries and weekly recurrence', () => {
    expect(createEventSchema.safeParse({ ...valid, title: 'a' }).success).toBe(
      true,
    );
    expect(
      createEventSchema.safeParse({ ...valid, title: 'a'.repeat(200) }).success,
    ).toBe(true);
    expect(
      createEventSchema.safeParse({
        ...valid,
        recurrence: { weekly: { until: '2026-12-18' } },
      }).success,
    ).toBe(true);
  });

  it('rejects invalid ordering, title, recurrence shape, and unknown fields', () => {
    expect(createEventSchema.safeParse({ ...valid, title: '' }).success).toBe(
      false,
    );
    expect(
      createEventSchema.safeParse({ ...valid, title: 'a'.repeat(201) }).success,
    ).toBe(false);
    expect(
      createEventSchema.safeParse({
        ...valid,
        start: valid.end,
        end: valid.start,
      }).success,
    ).toBe(false);
    expect(
      createEventSchema.safeParse({
        ...valid,
        recurrence: { daily: { until: '2026-12-18' } },
      }).success,
    ).toBe(false);
    expect(createEventSchema.safeParse({ ...valid, extra: true }).success).toBe(
      false,
    );
  });
});
