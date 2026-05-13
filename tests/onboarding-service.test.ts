import { IdentityVerificationStatus, OnboardingRole, UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getPrismaClient } from '@/lib/prisma';
import { completeJefeOnboarding, completeWorkerOnboarding } from '@/lib/onboarding-service';
import type { RequestAuthState } from '@/lib/request-auth';

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const getPrismaClientMock = vi.mocked(getPrismaClient);

const validPayload = {
  firstName: '  Ana ',
  lastName: ' Gomez ',
  dniNumber: '30123456',
  addressText: 'Salta Capital',
  workerCategories: ['cleaning', 'painting'],
  hourlyRatePesos: '4500',
  avatarBlobPath: 'profiles/user_001/avatars/avatar.jpg'
};

const validJefePayload = {
  firstName: '  Martin ',
  lastName: ' Ruiz ',
  addressText: 'Salta Capital',
  avatarBlobPath: 'profiles/user_002/avatars/avatar.jpg'
};

const activeWorkerAuth = {
  authenticated: true,
  configured: true,
  reason: null,
  identity: {
    id: 'auth_001',
    email: 'worker@yavaa.test'
  },
  matchedBy: 'supabase_auth_id',
  appUser: {
    id: 'user_001',
    email: 'worker@yavaa.test',
    supabaseAuthId: 'auth_001',
    displayName: null,
    status: UserStatus.ACTIVE,
    roles: ['trabajador'],
    profile: null
  },
  permissionContext: {
    userId: 'user_001',
    status: UserStatus.ACTIVE,
    roles: ['trabajador']
  }
} satisfies RequestAuthState;

const activeJefeAuth = {
  authenticated: true,
  configured: true,
  reason: null,
  identity: {
    id: 'auth_002',
    email: 'jefe@yavaa.test'
  },
  matchedBy: 'supabase_auth_id',
  appUser: {
    id: 'user_002',
    email: 'jefe@yavaa.test',
    supabaseAuthId: 'auth_002',
    displayName: null,
    status: UserStatus.ACTIVE,
    roles: ['jefe'],
    profile: null
  },
  permissionContext: {
    userId: 'user_002',
    status: UserStatus.ACTIVE,
    roles: ['jefe']
  }
} satisfies RequestAuthState;

afterEach(() => {
  vi.resetAllMocks();
});

describe('worker onboarding service', () => {
  it('rejects unauthenticated users without touching the database', async () => {
    const result = await completeWorkerOnboarding(
      {
        authenticated: false,
        configured: true,
        reason: 'missing-token',
        identity: null,
        appUser: null,
        matchedBy: null,
        permissionContext: null
      },
      validPayload
    );

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: 'Iniciá sesión para completar tu perfil.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('rejects authenticated users without a linked local user', async () => {
    const result = await completeWorkerOnboarding(
      {
        authenticated: true,
        configured: true,
        reason: null,
        identity: {
          id: 'auth_missing_local',
          email: 'missing@yavaa.test'
        },
        matchedBy: null,
        appUser: null,
        permissionContext: null
      },
      validPayload
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: 'No pudimos encontrar tu usuario de Yavaa.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('rejects suspended users before validating the payload', async () => {
    const result = await completeWorkerOnboarding(
      {
        ...activeWorkerAuth,
        appUser: {
          ...activeWorkerAuth.appUser,
          status: UserStatus.SUSPENDED
        },
        permissionContext: {
          ...activeWorkerAuth.permissionContext,
          status: UserStatus.SUSPENDED
        }
      },
      {}
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: 'Tu cuenta no está activa.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('rejects users without the trabajador role', async () => {
    const result = await completeWorkerOnboarding(
      {
        ...activeWorkerAuth,
        appUser: {
          ...activeWorkerAuth.appUser,
          roles: ['jefe']
        },
        permissionContext: {
          ...activeWorkerAuth.permissionContext,
          roles: ['jefe']
        }
      },
      validPayload
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: 'No tenés permiso para completar este perfil.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns field errors for invalid worker payloads without writing', async () => {
    const result = await completeWorkerOnboarding(activeWorkerAuth, {
      ...validPayload,
      hourlyRatePesos: 0
    });

    expect(result).toEqual({
      ok: false,
      status: 422,
      message: 'Revisá los datos del formulario.',
      fieldErrors: {
        hourlyRatePesos: ['El precio por hora tiene que ser mayor a 0.']
      }
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('rejects worker avatar paths that do not belong to the current user', async () => {
    const result = await completeWorkerOnboarding(activeWorkerAuth, {
      ...validPayload,
      avatarBlobPath: 'profiles/user_999/avatars/avatar.jpg'
    });

    expect(result).toEqual({
      ok: false,
      status: 422,
      message: 'Revisá los datos del formulario.',
      fieldErrors: {
        avatarBlobPath: ['Subí una foto válida.']
      }
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('updates only the current worker profile, avatar and hourly price in cents', async () => {
    const now = new Date('2026-05-12T12:00:00.000Z');
    const upsert = vi.fn().mockResolvedValue({});

    getPrismaClientMock.mockReturnValue({
      profile: {
        upsert
      }
    } as never);

    const result = await completeWorkerOnboarding(activeWorkerAuth, validPayload, now);

    expect(result).toEqual({
      ok: true,
      status: 200,
      nextPath: '/dashboard/trabajador'
    });
    expect(upsert).toHaveBeenCalledWith({
      where: {
        userId: 'user_001'
      },
      create: {
        userId: 'user_001',
        firstName: 'Ana',
        lastName: 'Gomez',
        avatarUrl: 'profiles/user_001/avatars/avatar.jpg',
        onboardingRole: OnboardingRole.TRABAJADOR,
        workerOnboardingCompletedAt: now,
        identityVerificationStatus: IdentityVerificationStatus.PENDING,
        dniNumber: '30123456',
        workerCategories: ['cleaning', 'painting'],
        workerHourlyRateCents: 450000,
        addressText: 'Salta Capital'
      },
      update: {
        firstName: 'Ana',
        lastName: 'Gomez',
        avatarUrl: 'profiles/user_001/avatars/avatar.jpg',
        onboardingRole: OnboardingRole.TRABAJADOR,
        workerOnboardingCompletedAt: now,
        identityVerificationStatus: IdentityVerificationStatus.PENDING,
        dniNumber: '30123456',
        workerCategories: ['cleaning', 'painting'],
        workerHourlyRateCents: 450000,
        addressText: 'Salta Capital'
      }
    });
  });
});

describe('jefe onboarding service', () => {
  it('rejects unauthenticated users without touching the database', async () => {
    const result = await completeJefeOnboarding(
      {
        authenticated: false,
        configured: true,
        reason: 'missing-token',
        identity: null,
        appUser: null,
        matchedBy: null,
        permissionContext: null
      },
      validJefePayload
    );

    expect(result).toEqual({
      ok: false,
      status: 401,
      message: 'Iniciá sesión para completar tu perfil.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('rejects users without the jefe role', async () => {
    const result = await completeJefeOnboarding(
      {
        ...activeJefeAuth,
        appUser: {
          ...activeJefeAuth.appUser,
          roles: ['trabajador']
        },
        permissionContext: {
          ...activeJefeAuth.permissionContext,
          roles: ['trabajador']
        }
      },
      validJefePayload
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: 'No tenés permiso para completar este perfil.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns field errors for invalid jefe payloads without writing', async () => {
    const result = await completeJefeOnboarding(activeJefeAuth, {
      ...validJefePayload,
      avatarBlobPath: 'profiles/user_999/avatars/avatar.jpg'
    });

    expect(result).toEqual({
      ok: false,
      status: 422,
      message: 'Revisá los datos del formulario.',
      fieldErrors: {
        avatarBlobPath: ['Subí una foto válida.']
      }
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('updates only the current jefe profile and redirects to client home', async () => {
    const now = new Date('2026-05-12T13:00:00.000Z');
    const upsert = vi.fn().mockResolvedValue({});

    getPrismaClientMock.mockReturnValue({
      profile: {
        upsert
      }
    } as never);

    const result = await completeJefeOnboarding(activeJefeAuth, validJefePayload, now);

    expect(result).toEqual({
      ok: true,
      status: 200,
      nextPath: '/dashboard/jefe'
    });
    expect(upsert).toHaveBeenCalledWith({
      where: {
        userId: 'user_002'
      },
      create: {
        userId: 'user_002',
        firstName: 'Martin',
        lastName: 'Ruiz',
        avatarUrl: 'profiles/user_002/avatars/avatar.jpg',
        onboardingRole: OnboardingRole.JEFE,
        jefeOnboardingCompletedAt: now,
        addressText: 'Salta Capital'
      },
      update: {
        firstName: 'Martin',
        lastName: 'Ruiz',
        avatarUrl: 'profiles/user_002/avatars/avatar.jpg',
        onboardingRole: OnboardingRole.JEFE,
        jefeOnboardingCompletedAt: now,
        addressText: 'Salta Capital'
      }
    });
  });
});
