import { UserStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/onboarding/trabajador/route';
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

function createRequest(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding/trabajador', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  });
}

describe('POST /api/onboarding/trabajador', () => {
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

    const response = await POST(createRequest({}));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Iniciá sesión para completar tu perfil.'
    });
  });

  it('returns 403 when the authenticated identity is not linked to a local user', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
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
    });

    const response = await POST(createRequest({}));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'No pudimos encontrar tu usuario de Yavaa.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the local user is suspended', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      ...activeWorkerAuth,
      appUser: {
        ...activeWorkerAuth.appUser,
        status: UserStatus.SUSPENDED
      },
      permissionContext: {
        ...activeWorkerAuth.permissionContext,
        status: UserStatus.SUSPENDED
      }
    });

    const response = await POST(createRequest({}));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Tu cuenta no está activa.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 403 when the user does not have the trabajador role', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      ...activeWorkerAuth,
      appUser: {
        ...activeWorkerAuth.appUser,
        roles: ['jefe']
      },
      permissionContext: {
        ...activeWorkerAuth.permissionContext,
        roles: ['jefe']
      }
    });

    const response = await POST(createRequest({}));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'No tenés permiso para completar este perfil.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 400 for malformed JSON', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);

    const response = await POST(
      new NextRequest('http://localhost/api/onboarding/trabajador', {
        method: 'POST',
        body: '{',
        headers: {
          'content-type': 'application/json'
        }
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'El cuerpo del pedido no es JSON válido.'
    });
  });

  it('returns 422 with field errors for invalid payloads', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);

    const response = await POST(
      createRequest({
        firstName: 'Ana',
        lastName: 'Gomez',
        dniNumber: '30123456',
        addressText: 'Salta Capital',
        workerCategories: ['cleaning'],
        hourlyRatePesos: 0
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá los datos del formulario.',
      fieldErrors: {
        hourlyRatePesos: ['El precio por hora tiene que ser mayor a 0.']
      }
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns hourly price errors on hourlyRatePesos for non-numeric form values', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);

    const response = await POST(
      createRequest({
        firstName: 'Ana',
        lastName: 'Gomez',
        dniNumber: '30123456',
        addressText: 'Salta Capital',
        workerCategories: ['cleaning'],
        hourlyRatePesos: 'gratis'
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá los datos del formulario.',
      fieldErrors: {
        hourlyRatePesos: ['Ingresá un precio por hora válido.']
      }
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns avatar errors on avatarBlobPath for photos from another user', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);

    const response = await POST(
      createRequest({
        firstName: 'Ana',
        lastName: 'Gomez',
        dniNumber: '30123456',
        addressText: 'Salta Capital',
        workerCategories: ['cleaning'],
        hourlyRatePesos: 4500,
        avatarBlobPath: 'profiles/user_999/avatars/avatar.jpg'
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá los datos del formulario.',
      fieldErrors: {
        avatarBlobPath: ['Subí una foto válida.']
      }
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 200 and the next path after a valid worker payload', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);

    const upsert = vi.fn().mockResolvedValue({});
    getPrismaClientMock.mockReturnValue({
      profile: {
        upsert
      }
    } as never);

    const response = await POST(
      createRequest({
        firstName: 'Ana',
        lastName: 'Gomez',
        dniNumber: '30123456',
        addressText: 'Salta Capital',
        workerCategories: ['cleaning'],
        hourlyRatePesos: 4500,
        avatarBlobPath: 'profiles/user_001/avatars/avatar.jpg'
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      nextPath: '/dashboard/trabajador'
    });
    expect(upsert).toHaveBeenCalledOnce();
  });
});
