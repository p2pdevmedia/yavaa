import { JobPostStatus, UserStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, POST } from '@/app/api/job-posts/route';
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
    profile: {
      firstName: 'Martin',
      lastName: 'Ruiz',
      avatarUrl: null,
      phone: null,
      bio: null,
      onboardingRole: null,
      workerOnboardingCompletedAt: null,
      jefeOnboardingCompletedAt: new Date('2026-05-12T00:00:00.000Z'),
      identityVerificationStatus: 'NOT_STARTED',
      dniNumber: null,
      workerCategories: [],
      workerHourlyRateCents: null,
      addressText: 'Salta Capital',
      locationLatitude: null,
      locationLongitude: null
    }
  },
  permissionContext: {
    userId: 'user_001',
    status: UserStatus.ACTIVE,
    roles: ['jefe']
  }
} satisfies RequestAuthState;

function createRequest(body: unknown) {
  return new NextRequest('http://localhost/api/job-posts', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  });
}

describe('/api/job-posts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 401 for unauthenticated creates', async () => {
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
      message: 'Iniciá sesión para publicar trabajos.'
    });
  });

  it('returns 400 for malformed JSON', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);

    const response = await POST(
      new NextRequest('http://localhost/api/job-posts', {
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

  it('creates a job post for completed jefe users', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);
    const create = vi.fn().mockResolvedValue({
      id: 'job_001',
      title: 'Pintar una habitación',
      category: 'painting',
      description: 'Necesito pintar una habitación chica esta semana.',
      addressText: 'Salta Capital',
      desiredTime: null,
      status: JobPostStatus.PUBLISHED,
      createdAt: new Date('2026-05-12T00:00:00.000Z')
    });
    getPrismaClientMock.mockReturnValue({
      jobPost: {
        create
      }
    } as never);

    const response = await POST(
      createRequest({
        title: 'Pintar una habitación',
        category: 'painting',
        description: 'Necesito pintar una habitación chica esta semana.',
        addressText: 'Salta Capital'
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      jobPost: {
        id: 'job_001',
        title: 'Pintar una habitación',
        category: 'painting',
        status: 'PUBLISHED'
      }
    });
  });

  it('returns only current client job posts', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);
    const createdAt = new Date('2026-05-12T00:00:00.000Z');
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'job_001',
        title: 'Pintar una habitación',
        category: 'painting',
        description: 'Necesito pintar una habitación chica esta semana.',
        addressText: 'Salta Capital',
        desiredTime: null,
        status: JobPostStatus.PUBLISHED,
        createdAt
      }
    ]);
    getPrismaClientMock.mockReturnValue({
      jobPost: {
        findMany
      }
    } as never);

    const response = await GET(new NextRequest('http://localhost/api/job-posts'));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      jobPosts: [
        {
          id: 'job_001',
          title: 'Pintar una habitación',
          category: 'painting',
          description: 'Necesito pintar una habitación chica esta semana.',
          addressText: 'Salta Capital',
          desiredTime: null,
          status: 'PUBLISHED',
          createdAt: createdAt.toISOString()
        }
      ]
    });
    expect(findMany).toHaveBeenCalledOnce();
  });
});
