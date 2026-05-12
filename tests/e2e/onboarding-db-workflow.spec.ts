import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import fs from 'node:fs';
import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  IdentityVerificationStatus,
  OnboardingRole,
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
let onboardingSchemaAvailable = false;

function getPrisma() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for DB-backed onboarding E2E tests.');
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

async function hasOnboardingSchema(): Promise<boolean> {
  if (!databaseAvailable) {
    return false;
  }

  const rows = await getPrisma().$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name::text AS column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name IN (
        'worker_onboarding_completed_at',
        'jefe_onboarding_completed_at',
        'identity_verification_status',
        'worker_categories',
        'worker_hourly_rate_cents',
        'address_text'
      )
  `;

  return rows.length === 6;
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

async function createWorkflowUser(input: {
  email: string;
  roles: Array<'jefe' | 'trabajador'>;
  profile?: {
    workerOnboardingCompletedAt?: Date | null;
    jefeOnboardingCompletedAt?: Date | null;
    workerHourlyRateCents?: number | null;
    workerCategories?: string[];
    addressText?: string | null;
  };
}): Promise<User> {
  const db = getPrisma();
  const roles = await seedRoles();

  const user = await db.user.create({
    data: {
      email: input.email,
      supabaseAuthId: `playwright:${input.email}`,
      displayName: 'Workflow Test',
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          firstName: 'Workflow',
          lastName: 'Test',
          addressText: input.profile?.addressText ?? null,
          identityVerificationStatus: IdentityVerificationStatus.PENDING,
          workerCategories: input.profile?.workerCategories ?? [],
          workerHourlyRateCents: input.profile?.workerHourlyRateCents ?? null,
          workerOnboardingCompletedAt: input.profile?.workerOnboardingCompletedAt ?? null,
          jefeOnboardingCompletedAt: input.profile?.jefeOnboardingCompletedAt ?? null
        }
      }
    }
  });

  await Promise.all(
    input.roles.map((role) =>
      db.userRole.create({
        data: {
          userId: user.id,
          roleId: roles[role].id
        }
      })
    )
  );

  return user;
}

async function cleanupWorkflowUsers(emails: string[]): Promise<void> {
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
  onboardingSchemaAvailable = await hasOnboardingSchema();
});

test.afterAll(async () => {
  await prisma?.$disconnect();
});

test.afterEach(async () => {
  await resetPrismaConnection();
});

test.describe.configure({ mode: 'serial' });

test.describe('DB-backed onboarding workflow', () => {
  test('routes inserted incomplete profiles to their selected onboarding wizard', async ({ page }) => {
    test.skip(!databaseAvailable, 'DATABASE_URL is missing or the database is not reachable.');
    test.skip(!onboardingSchemaAvailable, 'The onboarding Prisma migration has not been applied to this database.');

    const email = `e2e-incomplete-${randomUUID()}@yavaa.test`;

    try {
      await createWorkflowUser({
        email,
        roles: ['jefe', 'trabajador']
      });

      await authenticateAs(page, email);
      await page.goto('/dashboard/seleccionar-modo');

      await expect(page.getByRole('heading', { name: '¿Cómo querés usar Yavaa?' })).toBeVisible();

      await page
        .locator('article')
        .filter({ hasText: 'Quiero trabajar' })
        .getByRole('link', { name: 'Continuar' })
        .click();

      await expect(page).toHaveURL(/\/dashboard\/onboarding\/trabajador$/);
      await expect(page.getByRole('heading', { name: '¿Cómo te llamás?' })).toBeVisible();
    } finally {
      await cleanupWorkflowUsers([email]);
    }
  });

  test('routes inserted completed profiles directly to their role home', async ({ page }) => {
    test.skip(!databaseAvailable, 'DATABASE_URL is missing or the database is not reachable.');
    test.skip(!onboardingSchemaAvailable, 'The onboarding Prisma migration has not been applied to this database.');

    const email = `e2e-completed-${randomUUID()}@yavaa.test`;

    try {
      await createWorkflowUser({
        email,
        roles: ['jefe', 'trabajador'],
        profile: {
          jefeOnboardingCompletedAt: new Date('2026-05-12T00:00:00.000Z'),
          workerOnboardingCompletedAt: new Date('2026-05-12T00:00:00.000Z'),
          workerCategories: ['cleaning'],
          workerHourlyRateCents: 450000,
          addressText: 'Salta Capital'
        }
      });

      await authenticateAs(page, email);
      await page.goto('/dashboard/seleccionar-modo?perfil=jefe');

      await expect(page).toHaveURL(/\/dashboard\/jefe$/);
      await expect(page.getByRole('heading', { name: 'Publicá un trabajo' })).toBeVisible();

      await page.goto('/dashboard/seleccionar-modo?perfil=trabajador');

      await expect(page).toHaveURL(/\/dashboard\/trabajador$/);
      await expect(page.getByRole('heading', { name: 'Tu perfil laboral' })).toBeVisible();
    } finally {
      await cleanupWorkflowUsers([email]);
    }
  });

  test('completes the worker wizard and persists profile values through the API', async ({ page }) => {
    test.skip(!databaseAvailable, 'DATABASE_URL is missing or the database is not reachable.');
    test.skip(!onboardingSchemaAvailable, 'The onboarding Prisma migration has not been applied to this database.');

    const email = `e2e-worker-wizard-${randomUUID()}@yavaa.test`;

    try {
      const user = await createWorkflowUser({
        email,
        roles: ['trabajador']
      });

      await authenticateAs(page, email);
      await page.goto('/dashboard/onboarding/trabajador');

      await expect(page.getByRole('heading', { name: '¿Cómo te llamás?' })).toBeVisible();
      await page.getByLabel('Nombre').fill('');
      await page.getByLabel('Apellido').fill('');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Ingresá tu nombre.')).toBeVisible();
      await page.getByLabel('Nombre').fill('Ana');
      await page.getByLabel('Apellido').fill('Gomez');
      await page.getByRole('button', { name: 'Continuar' }).click();

      await expect(page.getByRole('heading', { name: 'Validemos tu identidad' })).toBeVisible();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Ingresá un DNI válido de 7 u 8 números.')).toBeVisible();
      await page.getByLabel('DNI').fill('30123456');
      await page.getByRole('button', { name: 'Continuar' }).click();

      await expect(page.getByRole('heading', { name: 'Subí fotos del DNI' })).toBeVisible();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Subí el frente del DNI.')).toBeVisible();
      await page.setInputFiles('input[name="dniFront"]', {
        name: 'dni-front.png',
        mimeType: 'image/png',
        buffer: Buffer.from('front')
      });
      await page.setInputFiles('input[name="dniBack"]', {
        name: 'dni-back.png',
        mimeType: 'image/png',
        buffer: Buffer.from('back')
      });
      await page.getByRole('button', { name: 'Continuar' }).click();

      await expect(page.getByRole('heading', { name: '¿Dónde trabajás?' })).toBeVisible();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Ingresá una ubicación válida.')).toBeVisible();
      await page.getByLabel('Zona de trabajo').fill('Salta Capital');
      await page.getByRole('button', { name: 'Continuar' }).click();

      await expect(page.getByRole('heading', { name: '¿Qué trabajos hacés?' })).toBeVisible();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Elegí al menos un tipo de trabajo.')).toBeVisible();
      await page.getByRole('button', { name: 'Limpieza' }).click();
      await page.getByRole('button', { name: 'Pintura' }).click();
      await page.getByRole('button', { name: 'Continuar' }).click();

      await expect(page.getByRole('heading', { name: '¿Cuánto cobrás por hora?' })).toBeVisible();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Ingresá un precio por hora válido.')).toBeVisible();
      await page.getByLabel('Precio por hora').fill('4500');
      await page.getByRole('button', { name: 'Continuar' }).click();

      await expect(page.getByRole('heading', { name: 'Tu perfil está listo' })).toBeVisible();
      await page.getByRole('button', { name: 'Finalizar perfil' }).click();

      await expect(page).toHaveURL(/\/dashboard\/trabajador$/);
      await expect(page.getByRole('heading', { name: 'Tu perfil laboral' })).toBeVisible();
      await expect(page.getByText('Verificación en revisión')).toBeVisible();
      await expect(page.getByText('Precio por hora')).toBeVisible();

      const profile = await getPrisma().profile.findUniqueOrThrow({
        where: {
          userId: user.id
        }
      });

      expect(profile.firstName).toBe('Ana');
      expect(profile.lastName).toBe('Gomez');
      expect(profile.dniNumber).toBe('30123456');
      expect(profile.addressText).toBe('Salta Capital');
      expect(profile.workerCategories.sort()).toEqual(['cleaning', 'painting']);
      expect(profile.workerHourlyRateCents).toBe(450000);
      expect(profile.workerOnboardingCompletedAt).toBeTruthy();
      expect(profile.identityVerificationStatus).toBe(IdentityVerificationStatus.PENDING);
    } finally {
      await cleanupWorkflowUsers([email]);
    }
  });

  test('completes the jefe wizard and lands on the client home', async ({ page }) => {
    test.skip(!databaseAvailable, 'DATABASE_URL is missing or the database is not reachable.');
    test.skip(!onboardingSchemaAvailable, 'The onboarding Prisma migration has not been applied to this database.');

    const email = `e2e-jefe-wizard-${randomUUID()}@yavaa.test`;

    try {
      const user = await createWorkflowUser({
        email,
        roles: ['jefe']
      });

      await authenticateAs(page, email);
      await page.goto('/dashboard/onboarding/jefe');

      await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible();
      await page.getByLabel('Nombre').fill('');
      await page.getByLabel('Apellido').fill('');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Ingresá tu nombre.')).toBeVisible();
      await page.getByLabel('Nombre').fill('Martin');
      await page.getByLabel('Apellido').fill('Ruiz');
      await page.getByRole('button', { name: 'Continuar' }).click();

      await expect(page.getByRole('heading', { name: '¿Dónde necesitás ayuda?' })).toBeVisible();
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Ingresá una ubicación válida.')).toBeVisible();
      await page.getByLabel('Zona donde necesitás ayuda').fill('Salta Capital');
      await page.getByRole('button', { name: 'Continuar' }).click();

      await expect(page.getByRole('heading', { name: 'Agregá una foto' })).toBeVisible();
      await page.getByLabel('URL de foto opcional').fill('foto-local');
      await page.getByRole('button', { name: 'Continuar' }).click();
      await expect(page.getByText('Ingresá una URL de foto válida.')).toBeVisible();
      await page.getByLabel('URL de foto opcional').fill('');
      await page.getByRole('button', { name: 'Continuar' }).click();

      await expect(page.getByRole('heading', { name: 'Ya podés contratar' })).toBeVisible();
      await page.getByRole('button', { name: 'Finalizar perfil' }).click();

      await expect(page).toHaveURL(/\/dashboard\/jefe$/);
      await expect(page.getByRole('heading', { name: /Hola, Martin/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Publicá un trabajo' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Publicar trabajo' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Buscar trabajadores' })).toBeVisible();

      const profile = await getPrisma().profile.findUniqueOrThrow({
        where: {
          userId: user.id
        }
      });

      expect(profile.firstName).toBe('Martin');
      expect(profile.lastName).toBe('Ruiz');
      expect(profile.addressText).toBe('Salta Capital');
      expect(profile.avatarUrl).toBeNull();
      expect(profile.onboardingRole).toBe(OnboardingRole.JEFE);
      expect(profile.jefeOnboardingCompletedAt).toBeTruthy();
    } finally {
      await cleanupWorkflowUsers([email]);
    }
  });
});
