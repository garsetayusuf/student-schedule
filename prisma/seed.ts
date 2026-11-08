import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const users = [
  { name: 'Alice', timeZone: 'Asia/Jakarta', token: 'token-alice' },
  { name: 'Bob', timeZone: 'Europe/London', token: 'token-bob' },
] as const;

async function main(): Promise<void> {
  for (const user of users) {
    const record = await prisma.user.upsert({
      where: { name: user.name },
      update: { timeZone: user.timeZone },
      create: { name: user.name, timeZone: user.timeZone },
    });

    await prisma.apiToken.upsert({
      where: { userId: record.id },
      update: {
        tokenHash: createHash('sha256').update(user.token).digest('hex'),
      },
      create: {
        userId: record.id,
        tokenHash: createHash('sha256').update(user.token).digest('hex'),
      },
    });
  }
}

main().finally(() => prisma.$disconnect());
