import { UserStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { POST } from '@/app/api/onboarding/jefe/route';
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

const activeJefeAuth = {
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
    profile: null
  },
  permissionContext: {
    userId: 'user_001',
    status: UserStatus.ACTIVE,
    roles: ['jefe']
  }
} satisfies RequestAuthState;

function createRequest(body: unknown) {
  return new NextRequest('http://localhost/api/onboarding/jefe', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  });
}

describe('POST /api/onboarding/jefe', () => {
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

  it('returns 403 when the local user is suspended', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      ...activeJefeAuth,
      appUser: {
        ...activeJefeAuth.appUser,
        status: UserStatus.SUSPENDED
      },
      permissionContext: {
        ...activeJefeAuth.permissionContext,
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

  it('returns 403 when the user does not have the jefe role', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      ...activeJefeAuth,
      appUser: {
        ...activeJefeAuth.appUser,
        roles: ['trabajador']
      },
      permissionContext: {
        ...activeJefeAuth.permissionContext,
        roles: ['trabajador']
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
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);

    const response = await POST(
      new NextRequest('http://localhost/api/onboarding/jefe', {
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
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);

    const response = await POST(
      createRequest({
        firstName: '',
        lastName: 'Ruiz',
        addressText: 'Salta Capital',
        avatarBlobPath: 'https://example.com/avatar.png'
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá los datos del formulario.',
      fieldErrors: {
        firstName: ['Ingresá tu nombre.'],
        avatarBlobPath: ['Subí una foto válida.']
      }
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 200 and the next path after a valid jefe payload', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);

    const upsert = vi.fn().mockResolvedValue({});
    getPrismaClientMock.mockReturnValue({
      profile: {
        upsert
      }
    } as never);

    const response = await POST(
      createRequest({
        firstName: 'Martin',
        lastName: 'Ruiz',
        addressText: 'Salta Capital',
        avatarBlobPath: null
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      nextPath: '/dashboard/jefe'
    });
    expect(upsert).toHaveBeenCalledOnce();
  });
});
