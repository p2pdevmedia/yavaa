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
            bio: 'Plomero'
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
      marketSlug: 'san-martin-de-los-andes',
      marketCity: 'San Martin de los Andes',
      marketProvince: 'Neuquen'
    });
    expect(result.items[0]).not.toHaveProperty('email');
    expect(result.items[0]).not.toHaveProperty('supabaseAuthId');
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
});
