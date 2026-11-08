import { describe, expect, it, vi } from 'vitest';
import { SubjectsService } from '../../src/modules/subjects/subjects.service.js';

describe('SubjectsService', () => {
  it('creates a subject with the authenticated user scope', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'subject-1',
      userId: 'alice',
      name: 'Biology',
      color: null,
    });
    const service = new SubjectsService({
      subject: { create, findMany: vi.fn() },
    } as never);
    await service.create('alice', { name: 'Biology' });
    expect(create).toHaveBeenCalledWith({
      data: { userId: 'alice', name: 'Biology' },
    });
  });

  it('lists only the authenticated user scope', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const service = new SubjectsService({
      subject: { create: vi.fn(), findMany },
    } as never);
    await service.list('bob');
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: 'bob' },
      orderBy: { name: 'asc' },
    });
  });
});
