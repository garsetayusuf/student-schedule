import { describe, expect, it } from 'vitest';
import { expandWeeklyOccurrences } from '../../src/modules/events/event-recurrence.js';

describe('weekly event recurrence', () => {
  it('includes the until date and keeps local time across London DST', () => {
    const occurrences = expandWeeklyOccurrences(
      {
        startLocal: new Date('2026-03-23T08:00:00.000Z'),
        endLocal: new Date('2026-03-23T09:00:00.000Z'),
        timeZone: 'Europe/London',
        recurrenceUntil: '2026-03-30',
      },
      new Date('2026-03-23T00:00:00.000Z'),
      new Date('2026-03-31T00:00:00.000Z'),
    );

    expect(occurrences).toEqual([
      {
        occurrenceStart: '2026-03-23T08:00',
        occurrenceEnd: '2026-03-23T09:00',
        startUtc: new Date('2026-03-23T08:00:00.000Z'),
        endUtc: new Date('2026-03-23T09:00:00.000Z'),
      },
      {
        occurrenceStart: '2026-03-30T08:00',
        occurrenceEnd: '2026-03-30T09:00',
        startUtc: new Date('2026-03-30T07:00:00.000Z'),
        endUtc: new Date('2026-03-30T08:00:00.000Z'),
      },
    ]);
  });

  it('returns no occurrences outside the requested UTC range', () => {
    const occurrences = expandWeeklyOccurrences(
      {
        startLocal: new Date('2026-11-02T08:00:00.000Z'),
        endLocal: new Date('2026-11-02T09:00:00.000Z'),
        timeZone: 'Asia/Jakarta',
        recurrenceUntil: '2026-11-30',
      },
      new Date('2026-12-01T00:00:00.000Z'),
      new Date('2026-12-08T00:00:00.000Z'),
    );

    expect(occurrences).toEqual([]);
  });
});
