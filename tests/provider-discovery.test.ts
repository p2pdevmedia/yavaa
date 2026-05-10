import { describe, expect, it, vi } from 'vitest';

import { hasDatabaseEnv } from '@/lib/env';
import { getPrismaClient } from '@/lib/prisma';
import { getPublicProviderProfile, listPublicProviders } from '@/lib/public-discovery';

vi.mock('@/lib/env', () => ({
  hasDatabaseEnv: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const mockedHasDatabaseEnv = vi.mocked(hasDatabaseEnv);
const mockedGetPrismaClient = vi.mocked(getPrismaClient);

describe('public discovery', () => {
  it('returns only approved active providers filtered by category and market', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'cp_001',
        acceptsEmergencies: true,
        profilePhotoUrl: null,
        user: {
          displayName: 'Foundation Contractor',
          profile: {
            firstName: 'Carlos',
            lastName: 'Perez',
            avatarUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
            bio: 'Plomero',
            phone: '+5493875551234'
          }
        },
        categories: [
          {
            isPrimary: true,
            category: {
              slug: 'home-services',
              name: 'Home Services',
              group: 'home services'
            }
          }
        ],
        workZones: [
          {
            workZone: {
              slug: 'central',
              name: 'Centro',
              description: 'Zona central',
              market: {
                slug: 'san-martin-de-los-andes',
                city: 'San Martin de los Andes',
                province: 'Neuquen'
              }
            }
          }
        ]
      }
    ]);

    mockedGetPrismaClient.mockReturnValue({
      contractorProfile: {
        findMany
      }
    } as never);

    const result = await listPublicProviders({
      category: 'home-services',
      market: 'san-martin-de-los-andes'
    });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      contractorProfileId: 'cp_001',
      displayName: 'Carlos Perez',
      bio: 'Plomero',
      acceptsEmergencies: true,
      profilePhotoUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
      marketSlug: 'san-martin-de-los-andes',
      marketCity: 'San Martin de los Andes',
      marketProvince: 'Neuquen'
    });
    expect(result.items[0]).not.toHaveProperty('email');
    expect(result.items[0]).not.toHaveProperty('phone');
    expect(result.items[0]).not.toHaveProperty('supabaseAuthId');
  });

  it('exposes public contact phone only on approved provider profiles', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findFirst = vi.fn().mockResolvedValue({
      id: 'cp_001',
      acceptsEmergencies: true,
      profilePhotoUrl: null,
      user: {
        displayName: 'Foundation Contractor',
        profile: {
          firstName: 'Carlos',
          lastName: 'Perez',
          bio: 'Plomero',
          phone: '+5493875551234'
        }
      },
      categories: [],
      workZones: []
    });

    mockedGetPrismaClient.mockReturnValue({
      contractorProfile: {
        findFirst
      }
    } as never);

    const result = await getPublicProviderProfile('cp_001');

    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      contractorProfileId: 'cp_001',
      phone: '+5493875551234'
    });
  });

  it('hides unapproved providers from public profile lookups', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findFirst = vi.fn().mockResolvedValue(null);

    mockedGetPrismaClient.mockReturnValue({
      contractorProfile: {
        findFirst
      }
    } as never);

    const result = await getPublicProviderProfile('cp_hidden');

    expect(findFirst).toHaveBeenCalledTimes(1);
    expect(result).toBeNull();
  });

  it('falls back to demo provider discovery when the database is unreachable', async () => {
    mockedHasDatabaseEnv.mockReturnValue(true);

    const findMany = vi.fn().mockRejectedValue({
      code: 'P1001'
    });

    mockedGetPrismaClient.mockReturnValue({
      contractorProfile: {
        findMany
      }
    } as never);

    const result = await listPublicProviders({
      category: 'home-services',
      market: 'san-martin-de-los-andes'
    });

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      contractorProfileId: '33333333-3333-3333-3333-333333333333',
      displayName: 'Carlos Perez'
    });
  });
});
