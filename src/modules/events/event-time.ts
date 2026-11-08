import { Temporal } from '@js-temporal/polyfill';
import { ApiError } from '../../helpers/response/api-error.js';

export function toUtc(local: string, timeZone: string): Date {
  try {
    const plain = Temporal.PlainDateTime.from(local);
    const instant = Temporal.ZonedDateTime.from(
      {
        timeZone,
        year: plain.year,
        month: plain.month,
        day: plain.day,
        hour: plain.hour,
        minute: plain.minute,
        second: plain.second,
      },
      { disambiguation: 'reject' },
    ).toInstant();
    return new Date(instant.epochMilliseconds);
  } catch {
    throw new ApiError('validation_error', 'Validation failed', 422, {
      timeZone: 'Invalid local time or time zone',
    });
  }
}
export const localDate = (value: string) => new Date(`${value}:00.000Z`);
