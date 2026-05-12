import { IdentityVerificationStatus, UserStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/onboarding/status/route';
import type { RequestAuthState } from '@/lib/request-auth';
import { resolveRequestAuth } from '@/lib/request-auth';

vi.mock('@/lib/request-auth', () => ({
  resolveRequestAuth: vi.fn()
}));

const resolveRequestAuthMock = vi.mocked(resolveRequestAuth);

function createRequest() {
  return new NextRequest('http://localhost/api/onboarding/status');
}

describe('onboarding status API route', () => {
  beforeEach(() => {
    resolveRequestAuthMock.mockReset();
  });

  it('returns 401 with sign-in nextPath when the request is unauthenticated', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      authenticated: false,
      configured: true,
      reason: 'missing-token',
      identity: null,
      appUser: null,
      matchedBy: null,
      permissionContext: null
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({
      authenticated: false,
      nextPath: '/sign-in?next=%2Fdashboard',
      modes: []
    });
  });

  it('returns 200 with field-ready mode paths for a linked user', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      authenticated: true,
      configured: true,
      reason: null,
      identity: {
        id: 'auth_001',
        email: 'jefe@yavaa.test'
      },
      matchedBy: 'supabase_auth_id',
      appUser: {
        id: 'user_001',
        email: 'jefe@yavaa.test',
        supabaseAuthId: 'auth_001',
        displayName: null,
        status: UserStatus.ACTIVE,
        roles: ['jefe'],
        profile: {
          firstName: null,
          lastName: null,
          avatarUrl: null,
          phone: null,
          bio: null,
          onboardingRole: null,
          workerOnboardingCompletedAt: null,
          jefeOnboardingCompletedAt: null,
          identityVerificationStatus: IdentityVerificationStatus.NOT_STARTED,
          dniNumber: null,
          workerCategories: [],
          workerHourlyRateCents: null,
          addressText: null,
          locationLatitude: null,
          locationLongitude: null
        }
      },
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['jefe']
      }
    } satisfies RequestAuthState);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      authenticated: true,
      linkedUser: true,
      nextPath: '/dashboard/onboarding/jefe',
      modes: [
        {
          mode: 'jefe',
          completed: false,
          nextPath: '/dashboard/onboarding/jefe'
        }
      ]
    });
  });

  it('returns 200 and a mode-selection fallback when auth exists but the local user is missing', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      authenticated: true,
      configured: true,
      reason: null,
      identity: {
        id: 'auth_missing_local',
        email: 'nuevo@yavaa.test'
      },
      matchedBy: null,
      appUser: null,
      permissionContext: null
    });

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      authenticated: true,
      linkedUser: false,
      nextPath: '/dashboard/seleccionar-modo',
      modes: []
    });
  });
});
