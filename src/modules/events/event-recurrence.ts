import { Temporal } from '@js-temporal/polyfill';
import { toUtc } from './event-time.js';

export interface EventTemplate {
  startLocal: Date;
  endLocal: Date;
  timeZone: string;
  recurrenceUntil: string;
}

export interface EventOccurrence {
  occurrenceStart: string;
  occurrenceEnd: string;
  startUtc: Date;
  endUtc: Date;
}

export function expandWeeklyOccurrences(
  event: EventTemplate,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
): EventOccurrence[] {
  const startLocalText = event.startLocal.toISOString().slice(0, 16);
  const startPlain = Temporal.PlainDateTime.from(startLocalText);
  const endPlain = Temporal.PlainDateTime.from(
    event.endLocal.toISOString().slice(0, 16),
  );
  const durationMinutes = endPlain.since(startPlain, {
    largestUnit: 'minutes',
  }).minutes;
  const firstDate = startPlain.toPlainDate();
  const lastDate = Temporal.PlainDate.from(event.recurrenceUntil);
  const occurrences: EventOccurrence[] = [];

  for (
    let date = firstDate;
    Temporal.PlainDate.compare(date, lastDate) <= 0;
    date = date.add({ days: 7 })
  ) {
    const occurrenceStartPlain = date.toPlainDateTime({
      hour: startPlain.hour,
      minute: startPlain.minute,
    });
    const occurrenceEndPlain = occurrenceStartPlain.add({
      minutes: durationMinutes,
    });
    const occurrenceStart = occurrenceStartPlain.toString({
      smallestUnit: 'minute',
    });
    const occurrenceEnd = occurrenceEndPlain.toString({
      smallestUnit: 'minute',
    });
    const startUtc = toUtc(occurrenceStart, event.timeZone);
    const endUtc = toUtc(occurrenceEnd, event.timeZone);

    if (startUtc < rangeEndUtc && endUtc > rangeStartUtc) {
      occurrences.push({ occurrenceStart, occurrenceEnd, startUtc, endUtc });
    }
  }

  return occurrences;
}
