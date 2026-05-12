import { JobPostStatus, UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createJobPost,
  createJobPostSchema,
  listClientJobPosts,
  type JobPostSummary
} from '@/lib/job-posts';
import { getPrismaClient } from '@/lib/prisma';
import type { RequestAuthState } from '@/lib/request-auth';

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const getPrismaClientMock = vi.mocked(getPrismaClient);

const validPayload = {
  title: '  Pintar una habitación ',
  category: 'painting',
  description: ' Necesito pintar una habitación chica esta semana. ',
  addressText: ' Salta Capital ',
  desiredTime: '2026-05-20T15:00:00.000Z'
};

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

afterEach(() => {
  vi.resetAllMocks();
});

describe('job post helpers', () => {
  it('validates and normalizes short mobile job posts', () => {
    const result = createJobPostSchema.safeParse(validPayload);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        title: 'Pintar una habitación',
        category: 'painting',
        description: 'Necesito pintar una habitación chica esta semana.',
        addressText: 'Salta Capital',
        desiredTime: '2026-05-20T15:00:00.000Z'
      });
    }
  });

  it('returns field errors without writing invalid payloads', async () => {
    const result = await createJobPost(activeJefeAuth, {
      title: 'Pi',
      category: '',
      description: 'corto',
      addressText: 'Sa',
      desiredTime: 'mañana'
    });

    expect(result).toEqual({
      ok: false,
      status: 422,
      message: 'Revisá los datos del trabajo.',
      fieldErrors: {
        title: ['Usá un título de al menos 3 caracteres.'],
        category: ['Elegí una categoría.'],
        description: ['Contá un poco más del trabajo.'],
        addressText: ['Ingresá una ubicación válida.'],
        desiredTime: ['Elegí una fecha válida.']
      }
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('rejects users that are not completed jefe profiles', async () => {
    const result = await createJobPost(
      {
        ...activeJefeAuth,
        appUser: {
          ...activeJefeAuth.appUser,
          profile: {
            ...activeJefeAuth.appUser.profile,
            jefeOnboardingCompletedAt: null
          }
        }
      },
      validPayload
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: 'Completá tu perfil de cliente para publicar trabajos.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('creates a published job owned by the current client', async () => {
    const create = vi.fn().mockResolvedValue({
      id: 'job_001',
      title: 'Pintar una habitación',
      category: 'painting',
      description: 'Necesito pintar una habitación chica esta semana.',
      addressText: 'Salta Capital',
      desiredTime: new Date('2026-05-20T15:00:00.000Z'),
      status: JobPostStatus.PUBLISHED,
      createdAt: new Date('2026-05-12T00:00:00.000Z')
    });

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        create
      }
    } as never);

    const result = await createJobPost(activeJefeAuth, validPayload);

    expect(result).toEqual({
      ok: true,
      status: 200,
      jobPost: {
        id: 'job_001',
        title: 'Pintar una habitación',
        category: 'painting',
        status: JobPostStatus.PUBLISHED
      }
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        clientId: 'user_001',
        title: 'Pintar una habitación',
        category: 'painting',
        description: 'Necesito pintar una habitación chica esta semana.',
        addressText: 'Salta Capital',
        desiredTime: new Date('2026-05-20T15:00:00.000Z')
      },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        addressText: true,
        desiredTime: true,
        status: true,
        createdAt: true
      }
    });
  });

  it('lists only the current client job posts newest first', async () => {
    const jobPosts: JobPostSummary[] = [
      {
        id: 'job_002',
        title: 'Limpieza de patio',
        category: 'cleaning',
        description: 'Necesito limpiar un patio.',
        addressText: 'Salta Capital',
        desiredTime: null,
        status: JobPostStatus.PUBLISHED,
        createdAt: new Date('2026-05-13T00:00:00.000Z')
      }
    ];
    const findMany = vi.fn().mockResolvedValue(jobPosts);

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        findMany
      }
    } as never);

    await expect(listClientJobPosts('user_001')).resolves.toEqual(jobPosts);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        clientId: 'user_001'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        addressText: true,
        desiredTime: true,
        status: true,
        createdAt: true
      },
      take: 10
    });
  });
});
