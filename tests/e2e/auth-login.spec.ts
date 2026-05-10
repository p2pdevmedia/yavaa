import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

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
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configuredAdminEmail = process.env.ADMIN_E2E_EMAIL;
const configuredAdminPassword = process.env.ADMIN_E2E_PASSWORD;

test.skip(!databaseUrl, 'DATABASE_URL is required for signup e2e.');

const signupPassword = 'Yavaa01!';
const adminLoginPassword = 'YavaaAdmin01!';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl!
  })
});

async function waitForProvisionedUser(email: string) {
  const timeoutMs = 30_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const appUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        supabaseAuthId: true,
        profile: {
          select: {
            id: true,
            userId: true
          }
        },
        roles: {
          select: {
            role: {
              select: {
                slug: true
              }
            }
          }
        }
      }
    });

    if (appUser?.supabaseAuthId && appUser.profile && appUser.roles.length > 0) {
      return appUser;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Timed out waiting for the signup trigger to provision ${email}.`);
}

async function cleanupSignup(email: string) {
  await prisma.$transaction(async (tx) => {
    const appUser = await tx.user.findUnique({
      where: { email },
      select: {
        id: true,
        supabaseAuthId: true
      }
    });

    const authUser = await tx.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM auth.users
      WHERE email = ${email}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (appUser) {
      await tx.user.delete({
        where: { id: appUser.id }
      });
    }

    const authUserId = appUser?.supabaseAuthId ?? authUser[0]?.id;

    if (authUserId) {
      await tx.$executeRaw`
        DELETE FROM auth.identities
        WHERE user_id = ${authUserId}::uuid
      `;

      await tx.$executeRaw`
        DELETE FROM auth.users
        WHERE id = ${authUserId}::uuid
      `;
    }
  });
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('signs up through the UI and provisions the database records', async ({ page }) => {
  const email = `signup-e2e-${randomUUID()}@yavaa.test`;

  try {
    await page.goto('/sign-up?next=%2Fdashboard');
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña').fill(signupPassword);
    await page.getByRole('button', { name: 'Registrar cuenta' }).click();

    const confirmationMessage = page.getByText(
      'Te enviamos un correo para confirmar tu cuenta. Después podés ingresar.'
    );
    const dashboardHeading = page.getByRole('heading', { name: /Perfil personal/i });
    const authError = page.getByTestId('auth-error');

    const outcome = await Promise.race([
      confirmationMessage
        .waitFor({ state: 'visible' })
        .then(() => 'confirmation' as const),
      page.waitForURL(/\/dashboard\/perfil$/).then(() => 'dashboard' as const),
      authError.waitFor({ state: 'visible' }).then(() => 'auth-error' as const),
      page.waitForTimeout(15_000).then(() => 'timeout' as const)
    ]);

    if (outcome === 'dashboard') {
      await expect(page).toHaveURL(/\/dashboard\/perfil$/);
      await expect(dashboardHeading).toBeVisible();
    } else if (outcome === 'confirmation') {
      await expect(confirmationMessage).toBeVisible();
    } else if (outcome === 'auth-error') {
      throw new Error(`Signup failed before provisioning: ${await authError.innerText()}`);
    } else {
      throw new Error(`Signup did not reach a terminal UI state. Current page text: ${await page.locator('body').innerText()}`);
    }

    const appUser = await waitForProvisionedUser(email);

    expect(appUser.email).toBe(email);
    expect(appUser.roles.map((entry) => entry.role.slug)).toContain('client');

    const authUser = await prisma.$queryRaw<{ id: string; email: string }[]>`
      SELECT id, email
      FROM auth.users
      WHERE id = ${appUser.supabaseAuthId}::uuid
      LIMIT 1
    `;

    expect(authUser).toHaveLength(1);
    expect(authUser[0]?.email).toBe(email);
  } finally {
    await cleanupSignup(email);
  }
});

test('admin signs in and sees operational dashboard data', async ({ page }) => {
  const hasConfiguredAdminCredentials = Boolean(configuredAdminEmail && configuredAdminPassword);
  const hasPartialConfiguredAdminCredentials =
    Boolean(configuredAdminEmail || configuredAdminPassword) && !hasConfiguredAdminCredentials;
  const canCreateSupabaseUser = !hasConfiguredAdminCredentials && Boolean(supabaseUrl && supabaseServiceRoleKey);
  const email =
    configuredAdminEmail ??
    (canCreateSupabaseUser ? `admin-login-e2e-${randomUUID()}@yavaa.test` : 'foundation-admin@yavaa.test');

  if (hasPartialConfiguredAdminCredentials) {
    throw new Error('ADMIN_E2E_EMAIL and ADMIN_E2E_PASSWORD must be configured together.');
  }

  try {
    if (hasConfiguredAdminCredentials) {
      await page.goto('/sign-in?next=%2Fdashboard%2Fadmin');
      await page.getByLabel('Correo electrónico').fill(configuredAdminEmail!);
      await page.getByLabel('Contraseña').fill(configuredAdminPassword!);
      await page.getByRole('button', { name: 'Ingresar' }).click();
    } else if (canCreateSupabaseUser) {
      const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceRoleKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      const { error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: adminLoginPassword,
        email_confirm: true,
        user_metadata: {
          name: 'E2E Admin'
        }
      });

      if (error) {
        throw new Error(`Could not create Supabase admin login user: ${error.message}`);
      }

      const appUser = await waitForProvisionedUser(email);
      const adminRole = await prisma.role.findUnique({
        where: { slug: 'admin' },
        select: { id: true }
      });

      if (!adminRole) {
        throw new Error('Admin role is missing from the deterministic seed.');
      }

      await prisma.user.update({
        where: { id: appUser.id },
        data: { displayName: 'E2E Admin' }
      });

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: appUser.id,
            roleId: adminRole.id
          }
        },
        update: {},
        create: {
          userId: appUser.id,
          roleId: adminRole.id
        }
      });

      await page.goto('/sign-in?next=%2Fdashboard%2Fadmin');
      await page.getByLabel('Correo electrónico').fill(email);
      await page.getByLabel('Contraseña').fill(adminLoginPassword);
      await page.getByRole('button', { name: 'Ingresar' }).click();
    } else {
      await page.context().addCookies([
        {
          name: 'yavaa-test-email',
          value: email,
          url: 'http://127.0.0.1:3000'
        }
      ]);

      await page.goto('/sign-in?next=%2Fdashboard%2Fadmin');
    }

    await expect(page).toHaveURL(/\/dashboard\/admin$/, { timeout: 15000 });
    await expect(page.getByText(email).first()).toBeVisible();
    await expect(page.getByText('admin').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Operación del marketplace/i })).toBeVisible({
      timeout: 15000
    });

    await expect(page.getByRole('heading', { name: 'Usuarios' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Categorías' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Bookings' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Contractors' })).toHaveCount(0);
  } finally {
    if (canCreateSupabaseUser) {
      await cleanupSignup(email);
    }
  }
});
