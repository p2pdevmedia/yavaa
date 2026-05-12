import { randomUUID } from 'node:crypto';

import { afterAll, describe, expect, it } from 'vitest';

import { getPrismaClient } from '@/lib/prisma';

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const suite = hasDatabaseUrl ? describe : describe.skip;
let prisma: ReturnType<typeof getPrismaClient> | null = null;

suite('auth provisioning', () => {
  afterAll(async () => {
    await prisma?.$disconnect();
  });

  it('creates the app user, profile, and selectable roles when auth.users receives a signup', async () => {
    prisma = getPrismaClient();

    const email = `signup-${randomUUID()}@yavaa.test`;
    const authUserId = randomUUID();
    const userMetadata = { name: 'Signup Test' };
    const appMetadata = { provider: 'email', providers: ['email'] };

    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO auth.users (
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          raw_app_meta_data,
          raw_user_meta_data,
          is_super_admin,
          is_sso_user,
          is_anonymous,
          created_at,
          updated_at
        )
        VALUES (
          ${authUserId}::uuid,
          'authenticated',
          'authenticated',
          ${email},
          crypt('Yavaa01!', gen_salt('bf')),
          now(),
          ${JSON.stringify(appMetadata)}::jsonb,
          ${JSON.stringify(userMetadata)}::jsonb,
          false,
          false,
          false,
          now(),
          now()
        )
      `;

      const appUser = await tx.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          supabaseAuthId: true,
          profile: {
            select: {
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

      expect(appUser).not.toBeNull();
      expect(appUser?.email).toBe(email);
      expect(appUser?.supabaseAuthId).toBe(authUserId);
      expect(appUser?.profile).not.toBeNull();
      expect(appUser?.profile?.userId).toBe(appUser?.id);
      expect(appUser?.roles.map((entry) => entry.role.slug).sort()).toEqual(['jefe', 'trabajador']);

      if (!appUser) {
        throw new Error('The app user was not created by the auth trigger.');
      }

      await tx.user.delete({
        where: { id: appUser.id }
      });

      await tx.$executeRaw`
        DELETE FROM auth.users
        WHERE id = ${authUserId}::uuid
      `;
    });
  });
});
