import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { getEnv } from '@/lib/env';

declare global {
  var __yavaaPrisma: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (!globalThis.__yavaaPrisma) {
    const env = getEnv();
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not configured.');
    }

    globalThis.__yavaaPrisma = new PrismaClient({
      adapter: new PrismaPg({
        connectionString: env.DATABASE_URL
      })
    });
  }

  return globalThis.__yavaaPrisma;
}
