import { Injectable } from '@nestjs/common';
import { Temporal } from '@js-temporal/polyfill';
import { ApiError } from '../../helpers/response/api-error.js';
import type {
  EventResponseDto,
  RecurrenceResponseDto,
} from './dto/event-response.dto.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import {
  createEventSchema,
  type CreateEventDto,
  type RecurrenceDto,
} from './dto/create-event.dto.js';
import type { PatchEventDto } from './dto/patch-event.dto.js';
import { expandWeeklyOccurrences } from './event-recurrence.js';
import { localDate, toUtc } from './event-time.js';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertSubject(
    userId: string,
    subjectId: string | null | undefined,
  ): Promise<void> {
    if (!subjectId) return;
    const subject = await this.prisma.subject.findFirst({
      where: { id: subjectId, userId },
    });
    if (!subject)
      throw new ApiError('validation_error', 'Validation failed', 422, {
        subjectId: 'Unknown subject',
      });
  }

  private validate(value: CreateEventDto): CreateEventDto {
    const result = createEventSchema.safeParse(value);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues)
        fields[String(issue.path[0] ?? 'body')] = issue.message;
      throw new ApiError('validation_error', 'Validation failed', 422, fields);
    }
    return result.data;
  }

  private recurrenceUntil(
    recurrence: RecurrenceDto | null | undefined,
    start: string,
  ): Date | null {
    if (!recurrence) return null;
    try {
      const until = Temporal.PlainDate.from(recurrence.weekly.until);
      const startDate = Temporal.PlainDate.from(start.slice(0, 10));
      if (Temporal.PlainDate.compare(until, startDate) < 0)
        throw new Error('before start');
      return new Date(`${until.toString()}T00:00:00.000Z`);
    } catch {
      throw new ApiError('validation_error', 'Validation failed', 422, {
        recurrence:
          'until must be a valid date on or after the event start date',
      });
    }
  }

  private data(userId: string, value: CreateEventDto) {
    return {
      userId,
      subjectId: value.subjectId ?? null,
      title: value.title,
      startLocal: localDate(value.start),
      endLocal: localDate(value.end),
      timeZone: value.timeZone,
      recurrenceUntil: this.recurrenceUntil(value.recurrence, value.start),
      startUtc: toUtc(value.start, value.timeZone),
      endUtc: toUtc(value.end, value.timeZone),
    };
  }

  private response(
    event: {
      id: string;
      title: string;
      subjectId: string | null;
      startLocal: Date;
      endLocal: Date;
      timeZone: string;
      recurrenceUntil: Date | null;
      startUtc: Date;
      endUtc: Date;
    },
    occurrence?: {
      occurrenceStart: string;
      occurrenceEnd: string;
      startUtc: Date;
      endUtc: Date;
    },
  ): EventResponseDto {
    const recurrence: RecurrenceResponseDto | undefined = event.recurrenceUntil
      ? { weekly: { until: event.recurrenceUntil.toISOString().slice(0, 10) } }
      : undefined;
    return {
      id: event.id,
      title: event.title,
      subjectId: event.subjectId,
      start:
        occurrence?.occurrenceStart ??
        event.startLocal.toISOString().slice(0, 16),
      end: occurrence
        ? occurrence.occurrenceEnd
        : event.endLocal.toISOString().slice(0, 16),
      timeZone: event.timeZone,
      ...(recurrence ? { recurrence } : {}),
      ...(occurrence ? { occurrenceStart: occurrence.occurrenceStart } : {}),
      startUtc: (occurrence?.startUtc ?? event.startUtc).toISOString(),
      endUtc: (occurrence?.endUtc ?? event.endUtc).toISOString(),
    };
  }

  async create(
    userId: string,
    value: CreateEventDto,
  ): Promise<EventResponseDto> {
    const valid = this.validate(value);
    await this.assertSubject(userId, valid.subjectId);
    return this.response(
      await this.prisma.event.create({ data: this.data(userId, valid) }),
    );
  }

  async one(userId: string, id: string): Promise<EventResponseDto> {
    const event = await this.prisma.event.findFirst({ where: { id, userId } });
    if (!event) throw new ApiError('not_found', 'Not found', 404);
    return this.response(event);
  }

  async update(
    userId: string,
    id: string,
    patch: PatchEventDto,
  ): Promise<EventResponseDto> {
    const current = await this.prisma.event.findFirst({
      where: { id, userId },
    });
    if (!current) throw new ApiError('not_found', 'Not found', 404);
    const value = this.validate({
      title: patch.title ?? current.title,
      subjectId:
        patch.subjectId === undefined ? current.subjectId : patch.subjectId,
      start: patch.start ?? current.startLocal.toISOString().slice(0, 16),
      end: patch.end ?? current.endLocal.toISOString().slice(0, 16),
      timeZone: patch.timeZone ?? current.timeZone,
      recurrence:
        patch.recurrence === undefined
          ? current.recurrenceUntil
            ? {
                weekly: {
                  until: current.recurrenceUntil.toISOString().slice(0, 10),
                },
              }
            : undefined
          : (patch.recurrence ?? undefined),
    });
    await this.assertSubject(userId, value.subjectId);
    return this.response(
      await this.prisma.event.update({
        where: { id: current.id },
        data: this.data(userId, value),
      }),
    );
  }

  async remove(userId: string, id: string): Promise<void> {
    const event = await this.prisma.event.findFirst({ where: { id, userId } });
    if (!event) throw new ApiError('not_found', 'Not found', 404);
    await this.prisma.event.delete({ where: { id: event.id } });
  }

  private rangeDate(value: string): string {
    try {
      return Temporal.PlainDate.from(value).toString();
    } catch {
      throw new ApiError('validation_error', 'Validation failed', 422, {
        date: 'Invalid calendar date',
      });
    }
  }

  async list(
    userId: string,
    from: string,
    to: string,
    timeZone: string,
  ): Promise<EventResponseDto[]> {
    const validFrom = this.rangeDate(from);
    const validTo = this.rangeDate(to);
    const start = toUtc(`${validFrom}T00:00`, timeZone);
    const nextDay = Temporal.PlainDate.from(validTo)
      .add({ days: 1 })
      .toString();
    const end = toUtc(`${nextDay}T00:00`, timeZone);
    const rangeStartDate = new Date(`${validFrom}T00:00:00.000Z`);
    const events = await this.prisma.event.findMany({
      where: {
        userId,
        startUtc: { lt: end },
        OR: [
          { recurrenceUntil: null, endUtc: { gt: start } },
          { recurrenceUntil: { gte: rangeStartDate } },
        ],
      },
      orderBy: { startUtc: 'asc' },
    });
    const responses = events.flatMap((event) => {
      if (!event.recurrenceUntil)
        return event.endUtc > start ? [this.response(event)] : [];
      return expandWeeklyOccurrences(
        {
          ...event,
          recurrenceUntil: event.recurrenceUntil.toISOString().slice(0, 10),
        },
        start,
        end,
      ).map((occurrence) => this.response(event, occurrence));
    });
    return responses.sort((left, right) =>
      left.startUtc.localeCompare(right.startUtc),
    );
  }
}
