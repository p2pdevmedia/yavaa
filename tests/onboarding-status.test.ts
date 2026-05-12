import { IdentityVerificationStatus, UserStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { getOnboardingStatus } from '@/lib/onboarding-status';
import type { RequestAuthState } from '@/lib/request-auth';

describe('onboarding status', () => {
  it('returns sign-in next path for unauthenticated requests', () => {
    const status = getOnboardingStatus({
      authenticated: false,
      configured: true,
      reason: 'missing-token',
      identity: null,
      appUser: null,
      matchedBy: null,
      permissionContext: null
    });

    expect(status).toEqual({
      authenticated: false,
      nextPath: '/sign-in?next=%2Fdashboard',
      modes: []
    });
  });

  it('returns available mode paths for linked users', () => {
    const status = getOnboardingStatus({
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
        roles: ['jefe', 'trabajador'],
        profile: {
          firstName: null,
          lastName: null,
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
          addressText: null,
          locationLatitude: null,
          locationLongitude: null
        }
      },
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['jefe', 'trabajador']
      }
    } satisfies RequestAuthState);

    expect(status.authenticated).toBe(true);
    expect(status.modes).toEqual([
      {
        mode: 'jefe',
        completed: true,
        nextPath: '/dashboard/jefe'
      },
      {
        mode: 'trabajador',
        completed: false,
        nextPath: '/dashboard/onboarding/trabajador'
      }
    ]);
  });

  it('keeps authenticated users without a linked local user on mode selection', () => {
    const status = getOnboardingStatus({
      authenticated: true,
      configured: true,
      reason: null,
      identity: {
        id: 'auth_002',
        email: 'nuevo@yavaa.test'
      },
      matchedBy: null,
      appUser: null,
      permissionContext: null
    });

    expect(status).toEqual({
      authenticated: true,
      linkedUser: false,
      nextPath: '/dashboard/seleccionar-modo',
      modes: []
    });
  });

  it('keeps linked users without selectable roles on mode selection without preselecting a role', () => {
    const status = getOnboardingStatus({
      authenticated: true,
      configured: true,
      reason: null,
      identity: {
        id: 'auth_003',
        email: 'sin-roles@yavaa.test'
      },
      matchedBy: 'supabase_auth_id',
      appUser: {
        id: 'user_003',
        email: 'sin-roles@yavaa.test',
        supabaseAuthId: 'auth_003',
        displayName: null,
        status: UserStatus.ACTIVE,
        roles: [],
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
        userId: 'user_003',
        status: UserStatus.ACTIVE,
        roles: []
      }
    } satisfies RequestAuthState);

    expect(status).toEqual({
      authenticated: true,
      linkedUser: true,
      nextPath: '/dashboard/seleccionar-modo',
      modes: []
    });
  });
});
