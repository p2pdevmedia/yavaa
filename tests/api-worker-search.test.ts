import { IdentityVerificationStatus, UserStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/workers/search/route';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';
import type { RequestAuthState } from '@/lib/request-auth';

vi.mock('@/lib/request-auth', () => ({
  resolveRequestAuth: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const resolveRequestAuthMock = vi.mocked(resolveRequestAuth);
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

describe('GET /api/workers/search', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 for unauthenticated requests', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      authenticated: false,
      configured: true,
      reason: 'missing-token',
      identity: null,
      appUser: null,
      matchedBy: null,
      permissionContext: null
    });

    const response = await GET(new NextRequest('http://localhost/api/workers/search'));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Iniciá sesión para buscar trabajadores.'
    });
  });

  it('returns searchable completed workers for completed jefe users', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    getPrismaClientMock.mockReturnValue({
      user: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'worker_001',
            email: 'carla@yavaa.test',
            displayName: null,
            profile: {
              firstName: 'Carla',
              lastName: 'Rojas',
              bio: 'Trabajo casas y oficinas por zona centro.',
              workerCategories: ['cleaning'],
              workerHourlyRateCents: 450000,
              identityVerificationStatus: IdentityVerificationStatus.PENDING,
              addressText: 'Salta Capital'
            }
          }
        ])
      }
    } as never);

    const response = await GET(new NextRequest('http://localhost/api/workers/search?category=cleaning&q=carla'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      workers: [
        {
          id: 'worker_001',
          displayName: 'Carla R.',
          categories: ['cleaning'],
          bio: 'Trabajo casas y oficinas por zona centro.',
          hourlyRateCents: 450000,
          identityVerificationStatus: 'PENDING',
          distanceLabel: 'Cerca',
          rating: {
            average: null,
            count: 0
          },
          workHistory: []
        }
      ]
    });
  });
});
