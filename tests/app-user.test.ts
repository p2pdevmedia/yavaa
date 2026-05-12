import { UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveAppUser } from '@/lib/app-user';
import { hasDatabaseEnv } from '@/lib/env';
import { getPrismaClient } from '@/lib/prisma';

vi.mock('@/lib/env', () => ({
  hasDatabaseEnv: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const mockedHasDatabaseEnv = vi.mocked(hasDatabaseEnv);
const mockedGetPrismaClient = vi.mocked(getPrismaClient);

afterEach(() => {
  vi.resetAllMocks();
});

describe('app user resolver', () => {
  it('returns a disconnected state when the database is not configured', async () => {
    mockedHasDatabaseEnv.mockReturnValue(false);

    const result = await resolveAppUser({
      id: 'auth_001',
      email: 'jefe@yavaa.test'
    });

    expect(result.configured).toBe(false);
    expect(result.user).toBeNull();
  });

  it('resolves a user by supabase auth id and maps roles and profile', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findFirst = vi.fn().mockResolvedValue({
      id: 'user_001',
      email: 'jefe@yavaa.test',
      supabaseAuthId: 'auth_001',
      displayName: 'Jefa Principal',
      status: UserStatus.ACTIVE,
      profile: {
        firstName: 'Jefa',
        lastName: 'Principal',
        avatarUrl: null,
        phone: '+54 9 1111 1111',
        bio: 'Cuenta jefe'
      },
      roles: [
        {
          role: {
            slug: 'jefe',
            name: 'Jefe'
          }
        }
      ]
    });

    mockedGetPrismaClient.mockReturnValue({
      user: {
        findFirst
      }
    } as never);

    const result = await resolveAppUser({
      id: 'auth_001',
      email: 'jefe@yavaa.test'
    });

    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(result.matchedBy).toBe('supabase_auth_id');
    expect(result.permissionContext?.roles).toEqual(['jefe']);
    expect(result.user?.profile?.firstName).toBe('Jefa');
  });

  it('falls back to matching by email when the auth id is not linked yet', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findFirst = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user_002',
        email: 'trabajador@yavaa.test',
        supabaseAuthId: null,
        displayName: 'Trabajador Principal',
        status: UserStatus.ACTIVE,
        profile: null,
        roles: [
          {
            role: {
              slug: 'trabajador',
              name: 'Trabajador'
            }
          }
        ]
      });

    mockedGetPrismaClient.mockReturnValue({
      user: {
        findFirst
      }
    } as never);

    const result = await resolveAppUser({
      id: 'auth_002',
      email: 'trabajador@yavaa.test'
    });

    expect(findFirst).toHaveBeenCalledTimes(2);
    expect(result.matchedBy).toBe('email');
    expect(result.permissionContext?.roles).toEqual(['trabajador']);
  });
});
