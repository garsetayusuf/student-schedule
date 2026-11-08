import { describe, expect, it, vi } from 'vitest';
import { EventsService } from '../../src/modules/events/events.service.js';
import { ApiError } from '../../src/helpers/response/api-error.js';

const event = {
  id: 'event-1',
  title: 'Biology',
  subjectId: null,
  startLocal: new Date('2026-11-09T08:00:00.000Z'),
  endLocal: new Date('2026-11-09T09:00:00.000Z'),
  timeZone: 'Asia/Jakarta',
  startUtc: new Date('2026-11-09T01:00:00.000Z'),
  endUtc: new Date('2026-11-09T02:00:00.000Z'),
};

describe('EventsService', () => {
  it('creates a valid event', async () => {
    const create = vi.fn().mockResolvedValue(event);
    const service = new EventsService({
      event: { create, findFirst: vi.fn() },
      subject: { findFirst: vi.fn() },
    } as never);
    const result = await service.create('alice', {
      title: 'Biology',
      start: '2026-11-09T08:00',
      end: '2026-11-09T09:00',
      timeZone: 'Asia/Jakarta',
    });
    expect(result).toMatchObject({ id: 'event-1', start: '2026-11-09T08:00' });
    expect(create).toHaveBeenCalledOnce();
  });

  it('hides an event outside the authenticated user scope', async () => {
    const service = new EventsService({
      event: { create: vi.fn(), findFirst: vi.fn().mockResolvedValue(null) },
      subject: { findFirst: vi.fn() },
    } as never);
    await expect(service.one('bob', 'alice-event')).rejects.toMatchObject({
      code: 'not_found',
      status: 404,
    } satisfies Partial<ApiError>);
  });

  it('validates the complete event after a patch', async () => {
    const service = new EventsService({
      event: {
        create: vi.fn(),
        findFirst: vi.fn().mockResolvedValue(event),
        update: vi.fn(),
      },
      subject: { findFirst: vi.fn() },
    } as never);
    await expect(
      service.update('alice', 'event-1', { end: '2026-11-09T07:00' }),
    ).rejects.toMatchObject({ code: 'validation_error', status: 422 });
  });
});
