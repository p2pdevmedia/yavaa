import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  IdentityVerificationStatus,
  JobPostStatus,
  PrismaClient,
  UserStatus,
  type Role,
  type User
} from '@prisma/client';
import { expect, test, type Page } from '@playwright/test';

function loadEnvFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const equalsIndex = trimmed.indexOf('=');

    if (equalsIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, equalsIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

for (const envFile of ['.env.local', '.env']) {
  loadEnvFile(path.join(process.cwd(), envFile));
}

const databaseUrl = process.env.DATABASE_URL;
let prisma: PrismaClient | null = null;
let databaseAvailable = false;
let marketplaceSchemaAvailable = false;

function getPrisma() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for DB-backed marketplace E2E tests.');
  }

  prisma ??= new PrismaClient({
    adapter: new PrismaPg({
      connectionString: databaseUrl
    })
  });

  return prisma;
}

function isTransientDatabaseError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /connection terminated|closed|timeout|ECONNRESET|P1001|P1002/i.test(error.message);
}

async function resetPrismaConnection(): Promise<void> {
  try {
    await prisma?.$disconnect();
  } catch {
    // The pooler may already have closed the connection.
  } finally {
    prisma = null;
  }
}

async function withDatabaseRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isTransientDatabaseError(error)) {
      throw error;
    }

    await resetPrismaConnection();
    return operation();
  }
}

async function canReachDatabase(): Promise<boolean> {
  if (!databaseUrl) {
    return false;
  }

  try {
    await getPrisma().$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function hasMarketplaceSchema(): Promise<boolean> {
  if (!databaseAvailable) {
    return false;
  }

  const rows = await getPrisma().$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name::text AS column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'job_posts'
      AND column_name IN (
        'id',
        'client_id',
        'title',
        'category',
        'description',
        'address_text',
        'desired_time',
        'photo_pathnames',
        'status',
        'created_at',
        'updated_at'
      )
  `;

  return rows.length === 11;
}

async function seedRoles(): Promise<Record<'jefe' | 'trabajador', Role>> {
  const db = getPrisma();
  const [jefe, trabajador] = await Promise.all([
    db.role.upsert({
      where: { slug: 'jefe' },
      update: { name: 'Jefe', description: 'Organiza y solicita trabajo.' },
      create: { slug: 'jefe', name: 'Jefe', description: 'Organiza y solicita trabajo.' }
    }),
    db.role.upsert({
      where: { slug: 'trabajador' },
      update: { name: 'Trabajador', description: 'Ofrece trabajo y coordina servicios.' },
      create: { slug: 'trabajador', name: 'Trabajador', description: 'Ofrece trabajo y coordina servicios.' }
    })
  ]);

  return { jefe, trabajador };
}

async function createMarketplaceUser(input: {
  email: string;
  role: 'jefe' | 'trabajador';
  firstName: string;
  lastName: string;
  addressText: string;
  workerCategories?: string[];
  workerHourlyRateCents?: number | null;
}): Promise<User> {
  const db = getPrisma();
  const roles = await seedRoles();
  const completedAt = new Date('2026-05-12T00:00:00.000Z');

  const user = await db.user.create({
    data: {
      email: input.email,
      supabaseAuthId: `playwright:${input.email}`,
      displayName: `${input.firstName} ${input.lastName}`,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: input.firstName,
          lastName: input.lastName,
          addressText: input.addressText,
          identityVerificationStatus:
            input.role === 'trabajador' ? IdentityVerificationStatus.VERIFIED : IdentityVerificationStatus.PENDING,
          workerCategories: input.workerCategories ?? [],
          workerHourlyRateCents: input.workerHourlyRateCents ?? null,
          workerOnboardingCompletedAt: input.role === 'trabajador' ? completedAt : null,
          jefeOnboardingCompletedAt: input.role === 'jefe' ? completedAt : null
        }
      },
      roles: {
        create: {
          roleId: roles[input.role].id
        }
      }
    }
  });

  return user;
}

async function cleanupMarketplaceUsers(emails: string[]): Promise<void> {
  if (!databaseAvailable || emails.length === 0) {
    return;
  }

  await withDatabaseRetry(() =>
    getPrisma().user.deleteMany({
      where: {
        email: {
          in: emails
        }
      }
    })
  );
}

async function authenticateAs(page: Page, email: string) {
  await page.context().addCookies([
    {
      name: 'yavaa-test-email',
      value: email,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax'
    }
  ]);
}

test.beforeAll(async () => {
  databaseAvailable = await canReachDatabase();
  marketplaceSchemaAvailable = await hasMarketplaceSchema();
});

test.afterAll(async () => {
  await prisma?.$disconnect();
});

test.afterEach(async () => {
  await resetPrismaConnection();
});

test.describe.configure({ mode: 'serial' });

test.describe('mobile marketplace entry flow', () => {
  test.use({
    viewport: {
      width: 390,
      height: 844
    }
  });

  test('publishes a job post, persists it, and shows it on client home', async ({ page }) => {
    test.skip(!databaseAvailable, 'DATABASE_URL is missing or the database is not reachable.');
    test.skip(!marketplaceSchemaAvailable, 'The marketplace Prisma migration has not been applied to this database.');

    const clientEmail = `e2e-market-client-${randomUUID()}@yavaa.test`;
    const jobTitle = `Pintar living ${randomUUID().slice(0, 8)}`;

    try {
      const client = await createMarketplaceUser({
        email: clientEmail,
        role: 'jefe',
        firstName: 'Martin',
        lastName: 'Mercado',
        addressText: 'Salta Capital'
      });
      const photoPathname = `jobs/${client.id}/photos/e2e-job-photo.jpg`;

      await page.route('**/api/job-posts/photos**', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              ok: true,
              pathname: photoPathname,
              previewSrc: `/api/job-posts/photos?pathname=${encodeURIComponent(photoPathname)}`
            })
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'image/jpeg',
          body: Buffer.from('photo')
        });
      });

      await authenticateAs(page, clientEmail);
      await page.goto('/dashboard/jefe/publicar-trabajo');

      await expect(page.getByRole('heading', { name: 'Contá qué necesitás' })).toBeVisible();
      await page.getByLabel('Título').fill(jobTitle);
      await page.getByLabel('Categoría').selectOption('painting');
      await page
        .getByLabel('Descripción')
        .fill('Necesito pintar un living chico, revisar paredes y coordinar materiales.');
      await page.getByLabel('Ubicación').fill('Salta Capital');
      await page.locator('input[name="desiredDate"]').fill('2026-06-15');
      await page.locator('input[name="desiredClockTime"]').fill('10:30');
      await page.setInputFiles('input[name="jobPhotos"]', {
        name: 'pared.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('photo')
      });
      await expect(page.getByAltText('Vista previa de foto del trabajo')).toBeVisible();
      await page.getByRole('button', { name: 'Publicar y recibir ofertas' }).click();

      await expect(page.getByText('Trabajo publicado')).toBeVisible();
      await expect(page.getByRole('heading', { name: jobTitle })).toBeVisible();

      const jobPost = await withDatabaseRetry(() =>
        getPrisma().jobPost.findFirstOrThrow({
          where: {
            clientId: client.id,
            title: jobTitle
          }
        })
      );

      expect(jobPost.category).toBe('painting');
      expect(jobPost.status).toBe(JobPostStatus.PUBLISHED);
      expect(jobPost.desiredTime).toBeTruthy();
      expect(jobPost.photoPathnames).toEqual([photoPathname]);

      await page.getByRole('link', { name: 'Volver al home' }).click();

      await expect(page).toHaveURL(/\/dashboard\/jefe$/);
      await expect(page.getByText('Trabajos activos')).toBeVisible();
      await expect(page.getByText(jobTitle)).toBeVisible();
    } finally {
      await cleanupMarketplaceUsers([clientEmail]);
    }
  });

  test('searches completed worker profiles from the protected client UI', async ({ page }) => {
    test.skip(!databaseAvailable, 'DATABASE_URL is missing or the database is not reachable.');
    test.skip(!marketplaceSchemaAvailable, 'The marketplace Prisma migration has not been applied to this database.');

    const suffix = randomUUID().slice(0, 8);
    const clientEmail = `e2e-search-client-${suffix}@yavaa.test`;
    const workerEmail = `e2e-search-worker-${suffix}@yavaa.test`;
    const uniqueZone = `Zona Etapa Cinco ${suffix}`;

    try {
      await createMarketplaceUser({
        email: clientEmail,
        role: 'jefe',
        firstName: 'Lucia',
        lastName: 'Cliente',
        addressText: 'Salta Capital'
      });
      await createMarketplaceUser({
        email: workerEmail,
        role: 'trabajador',
        firstName: 'Carla',
        lastName: 'Rojas',
        addressText: uniqueZone,
        workerCategories: ['painting', 'cleaning'],
        workerHourlyRateCents: 650000
      });

      await authenticateAs(page, clientEmail);
      await page.goto('/dashboard/jefe/buscar-trabajadores');

      await expect(page.getByRole('heading', { name: 'Compará perfiles cercanos' })).toBeVisible();
      await page.getByLabel('Buscar trabajadores').fill(uniqueZone);

      await expect(page.getByRole('heading', { name: 'Carla R.' })).toBeVisible();
      await expect(page.getByText('Precio por hora')).toBeVisible();
      await expect(page.getByText('Verificación aprobada')).toBeVisible();

      await page.getByRole('button', { name: 'Pintura' }).click();

      await expect(page.getByRole('heading', { name: 'Carla R.' })).toBeVisible();
      await expect(page.getByText('Pintura, Limpieza')).toBeVisible();
    } finally {
      await cleanupMarketplaceUsers([clientEmail, workerEmail]);
    }
  });
});
