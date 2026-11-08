import { createHash } from 'node:crypto';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { FastifyInstance } from 'fastify';
import { StandardSchemaValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/shared/prisma/prisma.service.js';

describe('Student Schedule API', () => {
  let app: NestFastifyApplication;
  let http: FastifyInstance;
  let prisma: PrismaService;
  let aliceId: string;
  let bobId: string;

  const auth = (token: string) => ({ authorization: `Bearer ${token}` });
  const aliceHeaders = auth('token-alice');
  const bobHeaders = auth('token-bob');

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    await app.init();
    http = app.getHttpAdapter().getInstance();
    prisma = app.get(PrismaService);

    const alice = await prisma.user.upsert({
      where: { name: 'Alice' },
      update: { timeZone: 'Asia/Jakarta' },
      create: { name: 'Alice', timeZone: 'Asia/Jakarta' },
    });
    const bob = await prisma.user.upsert({
      where: { name: 'Bob' },
      update: { timeZone: 'Europe/London' },
      create: { name: 'Bob', timeZone: 'Europe/London' },
    });
    aliceId = alice.id;
    bobId = bob.id;
    await prisma.apiToken.upsert({
      where: { userId: alice.id },
      update: {
        tokenHash: createHash('sha256').update('token-alice').digest('hex'),
      },
      create: {
        userId: alice.id,
        tokenHash: createHash('sha256').update('token-alice').digest('hex'),
      },
    });
    await prisma.apiToken.upsert({
      where: { userId: bob.id },
      update: {
        tokenHash: createHash('sha256').update('token-bob').digest('hex'),
      },
      create: {
        userId: bob.id,
        tokenHash: createHash('sha256').update('token-bob').digest('hex'),
      },
    });
  });

  beforeEach(async () => {
    await prisma.event.deleteMany({
      where: { userId: { in: [aliceId, bobId] } },
    });
    await prisma.subject.deleteMany({
      where: { userId: { in: [aliceId, bobId] } },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 for missing or unknown bearer tokens', async () => {
    const missing = await http.inject({ method: 'GET', url: '/subjects' });
    const unknown = await http.inject({
      method: 'GET',
      url: '/subjects',
      headers: auth('unknown'),
    });
    expect(missing.statusCode).toBe(401);
    expect(unknown.statusCode).toBe(401);
    expect(missing.json()).toEqual({
      error: { code: 'unauthorized', message: 'Unauthorized' },
    });
  });

  it('hides Alice events from Bob on read, patch, and delete', async () => {
    const created = await http.inject({
      method: 'POST',
      url: '/events',
      headers: aliceHeaders,
      payload: {
        title: 'Biology',
        start: '2026-11-09T08:00',
        end: '2026-11-09T09:00',
        timeZone: 'Asia/Jakarta',
      },
    });
    const id = created.json().data.id;

    for (const method of ['GET', 'PATCH', 'DELETE'] as const) {
      const response = await http.inject({
        method,
        url: `/events/${id}`,
        headers: bobHeaders,
        payload: method === 'PATCH' ? { title: 'Changed' } : undefined,
      });
      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: { code: 'not_found', message: 'Not found' },
      });
    }
  });

  it('returns 422 when an event ends before it starts', async () => {
    const response = await http.inject({
      method: 'POST',
      url: '/events',
      headers: aliceHeaders,
      payload: {
        title: 'Invalid',
        start: '2026-11-09T09:30',
        end: '2026-11-09T08:00',
        timeZone: 'Asia/Jakarta',
      },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('validation_error');
  });

  it('converts London wall-clock times across DST correctly', async () => {
    const before = await http.inject({
      method: 'POST',
      url: '/events',
      headers: bobHeaders,
      payload: {
        title: 'Before DST',
        start: '2026-03-23T08:00',
        end: '2026-03-23T09:00',
        timeZone: 'Europe/London',
      },
    });
    const after = await http.inject({
      method: 'POST',
      url: '/events',
      headers: bobHeaders,
      payload: {
        title: 'After DST',
        start: '2026-03-30T08:00',
        end: '2026-03-30T09:00',
        timeZone: 'Europe/London',
      },
    });
    expect(before.json().data.startUtc).toBe('2026-03-23T08:00:00.000Z');
    expect(after.json().data.startUtc).toBe('2026-03-30T07:00:00.000Z');
  });

  it('creates and lists a subject, then rejects a bad color', async () => {
    const created = await http.inject({
      method: 'POST',
      url: '/subjects',
      headers: aliceHeaders,
      payload: { name: 'Physics', color: '#112233' },
    });
    expect(created.statusCode).toBe(201);
    expect(created.json().data).toMatchObject({
      name: 'Physics',
      color: '#112233',
    });

    const listed = await http.inject({
      method: 'GET',
      url: '/subjects',
      headers: aliceHeaders,
    });
    expect(listed.json().data).toEqual([
      expect.objectContaining({ name: 'Physics' }),
    ]);

    const invalid = await http.inject({
      method: 'POST',
      url: '/subjects',
      headers: aliceHeaders,
      payload: { name: 'Invalid', color: 'red' },
    });
    expect(invalid.statusCode).toBe(422);
    expect(invalid.json().error.code).toBe('validation_error');
  });

  it('gets, patches, lists, and deletes an owned event', async () => {
    const created = await http.inject({
      method: 'POST',
      url: '/events',
      headers: aliceHeaders,
      payload: {
        title: 'Chemistry',
        start: '2026-11-09T08:00',
        end: '2026-11-09T09:00',
        timeZone: 'Asia/Jakarta',
      },
    });
    const id = created.json().data.id;
    const patched = await http.inject({
      method: 'PATCH',
      url: `/events/${id}`,
      headers: aliceHeaders,
      payload: { title: 'Advanced Chemistry' },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json().data.title).toBe('Advanced Chemistry');

    const listed = await http.inject({
      method: 'GET',
      url: '/events?from=2026-11-09&to=2026-11-09',
      headers: aliceHeaders,
    });
    expect(listed.json().data).toEqual([
      expect.objectContaining({ id, title: 'Advanced Chemistry' }),
    ]);

    const deleted = await http.inject({
      method: 'DELETE',
      url: `/events/${id}`,
      headers: aliceHeaders,
    });
    expect(deleted.statusCode).toBe(204);
    expect(deleted.body).toBe('');
  });

  it('returns a public database health result in the required envelope', async () => {
    const response = await http.inject({ method: 'GET', url: '/healthz' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { status: 'ok', database: 'up' } });
  });
});
