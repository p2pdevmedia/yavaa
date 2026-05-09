import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { expect, test } from '@playwright/test';

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

test.skip(!databaseUrl, 'DATABASE_URL is required for auth login e2e.');

const loginPassword = 'Yavaa01!';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: databaseUrl!
  })
});

async function createAuthFixture() {
  const email = `e2e-login-${randomUUID()}@yavaa.test`;
  const authUserId = randomUUID();

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        confirmation_token,
        invited_at,
        recovery_token,
        email_change_token_current,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        confirmation_sent_at,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        is_sso_user,
        is_anonymous,
        deleted_at,
        created_at,
        updated_at
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000'::uuid,
        ${authUserId}::uuid,
        'authenticated',
        'authenticated',
        ${email},
        crypt(${loginPassword}, gen_salt('bf')),
        now(),
        '',
        null,
        '',
        '',
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        '',
        null,
        null,
        ${JSON.stringify({ provider: 'email', providers: ['email'] })}::jsonb,
        ${JSON.stringify({ name: 'E2E Login' })}::jsonb,
        false,
        false,
        false,
        null,
        now(),
        now()
      )
    `;

    await tx.$executeRaw`
      UPDATE auth.users
      SET confirmed_at = DEFAULT,
          email_confirmed_at = now(),
          raw_user_meta_data = ${JSON.stringify({
            sub: authUserId,
            email,
            email_verified: true,
            phone_verified: false
          })}::jsonb,
          updated_at = now()
      WHERE id = ${authUserId}::uuid
    `;

    await tx.$executeRaw`
      INSERT INTO auth.identities (
        id,
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        ${randomUUID()}::uuid,
        ${authUserId},
        ${authUserId}::uuid,
        ${JSON.stringify({
          sub: authUserId,
          email,
          email_verified: true,
          phone_verified: false,
          provider: 'email'
        })}::jsonb,
        'email',
        null,
        now(),
        now()
      )
      ON CONFLICT (provider_id, provider) DO UPDATE SET
        user_id = EXCLUDED.user_id,
        identity_data = EXCLUDED.identity_data,
        last_sign_in_at = NOW(),
        updated_at = NOW()
    `;
  });

  return {
    email,
    authUserId,
    async cleanup() {
      await prisma.$transaction(async (tx) => {
        const appUser = await tx.user.findUnique({
          where: { email },
          select: { id: true }
        });

        if (appUser) {
          await tx.user.delete({
            where: { id: appUser.id }
          });
        }

      await tx.$executeRaw`
        DELETE FROM auth.identities
        WHERE user_id = ${authUserId}::uuid
      `;

      await tx.$executeRaw`
        DELETE FROM auth.users
        WHERE id = ${authUserId}::uuid
      `;
      });
    }
  };
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test('logs in successfully with a DB-provisioned auth user', async ({ page }) => {
  const fixture = await createAuthFixture();

  try {
    await page.goto('/sign-in?next=%2Fdashboard');
    await page.getByLabel('Correo electrónico').fill(fixture.email);
    await page.getByLabel('Contraseña').fill(loginPassword);
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole('heading', { name: /Bookings y chat/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Cerrar sesión/i })).toBeVisible();
  } finally {
    await fixture.cleanup();
  }
});
