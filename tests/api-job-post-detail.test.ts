import { JobPostStatus, UserStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PATCH } from '@/app/api/job-posts/[jobPostId]/route';
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

function createPatchRequest(body: unknown) {
  return new NextRequest('http://localhost/api/job-posts/job_001', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  });
}

describe('/api/job-posts/[jobPostId]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('updates an editable active job post for its owning jefe', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const findFirst = vi.fn().mockResolvedValue({
      id: 'job_001',
      title: 'Mural renovado',
      category: 'painting',
      description: 'Pintar un mural exterior con dos colores.',
      addressText: 'San Martin de los Andes',
      desiredTime: null,
      photoPathnames: [],
      status: JobPostStatus.IN_PROGRESS,
      createdAt: new Date('2026-05-13T00:00:00.000Z')
    });

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        updateMany,
        findFirst
      }
    } as never);

    const response = await PATCH(createPatchRequest({
      title: 'Mural renovado',
      category: 'painting',
      description: 'Pintar un mural exterior con dos colores.',
      addressText: 'San Martin de los Andes'
    }), {
      params: Promise.resolve({ jobPostId: 'job_001' })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      jobPost: {
        id: 'job_001',
        title: 'Mural renovado',
        category: 'painting',
        description: 'Pintar un mural exterior con dos colores.',
        addressText: 'San Martin de los Andes',
        desiredTime: null,
        photoPathnames: [],
        status: 'IN_PROGRESS',
        createdAt: '2026-05-13T00:00:00.000Z'
      }
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 'job_001',
        clientId: 'user_001',
        status: {
          in: [JobPostStatus.PUBLISHED, JobPostStatus.IN_PROGRESS, JobPostStatus.READY_FOR_REVIEW]
        }
      },
      data: {
        title: 'Mural renovado',
        category: 'painting',
        description: 'Pintar un mural exterior con dos colores.',
        addressText: 'San Martin de los Andes',
        desiredTime: null
      }
    });
  });

  it('returns 404 when the job post is not active and owned by the current jefe', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeJefeAuth);
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        updateMany
      }
    } as never);

    const response = await PATCH(createPatchRequest({
      title: 'Mural renovado',
      category: 'painting',
      description: 'Pintar un mural exterior con dos colores.',
      addressText: 'San Martin de los Andes'
    }), {
      params: Promise.resolve({ jobPostId: 'job_001' })
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'No encontramos ese trabajo activo.'
    });
  });
});
