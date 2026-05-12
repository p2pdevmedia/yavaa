import { IdentityVerificationStatus, UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPrismaClient } from '@/lib/prisma';
import { searchWorkers } from '@/lib/worker-search';
import type { RequestAuthState } from '@/lib/request-auth';

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const getPrismaClientMock = vi.mocked(getPrismaClient);

const activeClientAuth = {
  authenticated: true,
  configured: true,
  reason: null,
  identity: {
    id: 'auth_001',
    email: 'jefe@yavaa.test'
  },
  matchedBy: 'supabase_auth_id',
  appUser: {
    id: 'client_001',
    email: 'jefe@yavaa.test',
    supabaseAuthId: 'auth_001',
    displayName: null,
    status: UserStatus.ACTIVE,
    roles: ['jefe'],
    profile: {
      firstName: 'Martin',
      lastName: 'Ruiz',
      avatarUrl: null,
      phone: null,
      bio: null,
      onboardingRole: null,
      workerOnboardingCompletedAt: null,
      jefeOnboardingCompletedAt: new Date('2026-05-12T00:00:00.000Z'),
      identityVerificationStatus: IdentityVerificationStatus.NOT_STARTED,
      dniNumber: null,
      workerCategories: [],
      workerHourlyRateCents: null,
      addressText: 'Salta Capital',
      locationLatitude: null,
      locationLongitude: null
    }
  },
  permissionContext: {
    userId: 'client_001',
    status: UserStatus.ACTIVE,
    roles: ['jefe']
  }
} satisfies RequestAuthState;

afterEach(() => {
  vi.resetAllMocks();
});

describe('worker search', () => {
  it('rejects clients without completed jefe onboarding', async () => {
    const result = await searchWorkers({
      ...activeClientAuth,
      appUser: {
        ...activeClientAuth.appUser,
        profile: {
          ...activeClientAuth.appUser.profile,
          jefeOnboardingCompletedAt: null
        }
      }
    });

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: 'Completá tu perfil de cliente para buscar trabajadores.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('searches only active completed worker profiles with categories', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'worker_001',
        email: 'carla@yavaa.test',
        displayName: null,
        profile: {
          firstName: 'Carla',
          lastName: 'Rojas',
          workerCategories: ['cleaning'],
          workerHourlyRateCents: 450000,
          identityVerificationStatus: IdentityVerificationStatus.PENDING,
          addressText: 'Salta Capital'
        }
      }
    ]);

    getPrismaClientMock.mockReturnValue({
      user: {
        findMany
      }
    } as never);

    const result = await searchWorkers(activeClientAuth, {
      category: 'cleaning',
      q: 'carla'
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      workers: [
        {
          id: 'worker_001',
          displayName: 'Carla R.',
          categories: ['cleaning'],
          hourlyRateCents: 450000,
          identityVerificationStatus: IdentityVerificationStatus.PENDING,
          distanceLabel: 'Cerca'
        }
      ]
    });
    expect(findMany).toHaveBeenCalledWith({
      where: {
        status: UserStatus.ACTIVE,
        roles: {
          some: {
            role: {
              slug: 'trabajador'
            }
          }
        },
        profile: {
          is: {
            workerOnboardingCompletedAt: {
              not: null
            },
            workerCategories: {
              isEmpty: false,
              has: 'cleaning'
            },
            OR: [
              {
                firstName: {
                  contains: 'carla',
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: 'carla',
                  mode: 'insensitive'
                }
              },
              {
                addressText: {
                  contains: 'carla',
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: expect.any(Object),
      take: 20
    });
  });
});
