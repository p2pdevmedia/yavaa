import { UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveAppUser } from '@/lib/app-user';
import { getPrismaClient } from '@/lib/prisma';
import { hasDatabaseEnv } from '@/lib/env';

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
      email: 'foundation-admin@yavaa.test'
    });

    expect(result.configured).toBe(false);
    expect(result.user).toBeNull();
  });

  it('resolves a user by supabase auth id and maps roles, profile, and addresses', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findFirst = vi.fn().mockResolvedValue({
      id: 'user_001',
      email: 'foundation-admin@yavaa.test',
      supabaseAuthId: 'auth_001',
      displayName: 'Foundation Admin',
      status: UserStatus.ACTIVE,
      profile: {
        firstName: 'Foundation',
        lastName: 'Admin',
        avatarUrl: null,
        phone: '+54 9 1111 1111',
        bio: 'Seed admin'
      },
      addresses: [
        {
          id: 'address_001',
          label: 'Home',
          line1: 'Av. San Martin 123',
          line2: null,
          city: 'San Martin de los Andes',
          province: 'Neuquen',
          postalCode: '8370',
          notes: null,
          type: 'HOME',
          isDefault: true,
          market: {
            id: 'market_001',
            slug: 'san-martin-de-los-andes',
            city: 'San Martin de los Andes',
            province: 'Neuquen',
            country: 'Argentina'
          }
        }
      ],
      roles: [
        {
          role: {
            slug: 'admin',
            name: 'Admin'
          }
        }
      ],
      contractorProfile: null
    });

    mockedGetPrismaClient.mockReturnValue({
      user: {
        findFirst
      }
    } as never);

    const result = await resolveAppUser({
      id: 'auth_001',
      email: 'foundation-admin@yavaa.test'
    });

    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(result.matchedBy).toBe('supabase_auth_id');
    expect(result.permissionContext?.roles).toEqual(['admin']);
    expect(result.user?.profile?.firstName).toBe('Foundation');
    expect(result.user?.addresses).toHaveLength(1);
  });

  it('falls back to matching by email when the auth id is not linked yet', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findFirst = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'user_002',
        email: 'foundation-contractor@yavaa.test',
        supabaseAuthId: null,
        displayName: 'Foundation Contractor',
        status: UserStatus.ACTIVE,
        profile: null,
        addresses: [],
        roles: [
          {
            role: {
              slug: 'contractor',
              name: 'Contractor'
            }
          }
        ],
        contractorProfile: null
      });

    mockedGetPrismaClient.mockReturnValue({
      user: {
        findFirst
      }
    } as never);

    const result = await resolveAppUser({
      id: 'auth_002',
      email: 'foundation-contractor@yavaa.test'
    });

    expect(findFirst).toHaveBeenCalledTimes(2);
    expect(result.matchedBy).toBe('email');
    expect(result.permissionContext?.roles).toEqual(['contractor']);
  });
});
