import { describe, expect, it } from 'vitest';
import { toUtc } from '../../src/modules/events/event-time.js';

describe('event time conversion', () => {
  it('preserves London wall-clock time across DST', () => {
    expect(toUtc('2026-03-23T08:00', 'Europe/London').toISOString()).toBe(
      '2026-03-23T08:00:00.000Z',
    );
    expect(toUtc('2026-03-30T08:00', 'Europe/London').toISOString()).toBe(
      '2026-03-30T07:00:00.000Z',
    );
  });

  it('rejects an unknown time zone', () => {
    expect(() => toUtc('2026-03-30T08:00', 'Not/AZone')).toThrow(
      'Validation failed',
    );
  });

  it('rejects a nonexistent DST wall-clock time', () => {
    expect(() => toUtc('2026-03-29T01:30', 'Europe/London')).toThrow(
      'Validation failed',
    );
  });
});
