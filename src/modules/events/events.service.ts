import { Injectable } from '@nestjs/common';
import { Temporal } from '@js-temporal/polyfill';
import { ApiError } from '../../helpers/response/api-error.js';
import type { EventResponseDto } from './dto/event-response.dto.js';
import { PrismaService } from '../../shared/prisma/prisma.service.js';
import {
  createEventSchema,
  type CreateEventDto,
} from './dto/create-event.dto.js';
import type { PatchEventDto } from './dto/patch-event.dto.js';
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

  private data(userId: string, value: CreateEventDto) {
    return {
      userId,
      subjectId: value.subjectId ?? null,
      title: value.title,
      startLocal: localDate(value.start),
      endLocal: localDate(value.end),
      timeZone: value.timeZone,
      startUtc: toUtc(value.start, value.timeZone),
      endUtc: toUtc(value.end, value.timeZone),
    };
  }

  private response(event: {
    id: string;
    title: string;
    subjectId: string | null;
    startLocal: Date;
    endLocal: Date;
    timeZone: string;
    startUtc: Date;
    endUtc: Date;
  }): EventResponseDto {
    return {
      id: event.id,
      title: event.title,
      subjectId: event.subjectId,
      start: event.startLocal.toISOString().slice(0, 16),
      end: event.endLocal.toISOString().slice(0, 16),
      timeZone: event.timeZone,
      startUtc: event.startUtc.toISOString(),
      endUtc: event.endUtc.toISOString(),
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

  async list(
    userId: string,
    from: string,
    to: string,
    timeZone: string,
  ): Promise<EventResponseDto[]> {
    const start = toUtc(`${from}T00:00`, timeZone);
    const nextDay = Temporal.PlainDate.from(to).add({ days: 1 }).toString();
    const end = toUtc(`${nextDay}T00:00`, timeZone);
    const events = await this.prisma.event.findMany({
      where: { userId, startUtc: { lt: end }, endUtc: { gt: start } },
      orderBy: { startUtc: 'asc' },
    });
    return events.map((event) => this.response(event));
  }
}
