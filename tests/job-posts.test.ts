import { JobPostStatus, UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  createJobPost,
  createJobPostSchema,
  getActiveClientJobPost,
  getClientJobPostForDetail,
  listActiveClientJobPosts,
  listClientJobPosts,
  listPublishedWorkerJobPosts,
  updateAuthenticatedClientJobPost,
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
  desiredTime: '2026-05-20T15:00:00.000Z',
  photoPathnames: ['jobs/user_001/photos/pared.jpg']
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
        desiredTime: '2026-05-20T15:00:00.000Z',
        photoPathnames: ['jobs/user_001/photos/pared.jpg']
      });
    }
  });

  it('returns field errors without writing invalid payloads', async () => {
    const result = await createJobPost(activeJefeAuth, {
      title: 'Pi',
      category: '',
      description: 'corto',
      addressText: 'Sa',
      desiredTime: 'mañana',
      photoPathnames: ['profiles/user_001/avatars/avatar.jpg']
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
        desiredTime: ['Elegí una fecha válida.'],
        photoPathnames: ['Usá fotos subidas desde este trabajo.']
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
      photoPathnames: ['jobs/user_001/photos/pared.jpg'],
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
        desiredTime: new Date('2026-05-20T15:00:00.000Z'),
        photoPathnames: ['jobs/user_001/photos/pared.jpg']
      },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        addressText: true,
        desiredTime: true,
        photoPathnames: true,
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
        photoPathnames: ['jobs/user_001/photos/patio.jpg'],
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
        photoPathnames: true,
        status: true,
        createdAt: true
      },
      take: 10
    });
  });

  it('lists every active client job post across published and accepted states', async () => {
    const jobPosts: JobPostSummary[] = [
      {
        id: 'job_accepted',
        title: 'Placard en curso',
        category: 'carpinteria',
        description: 'Placard con oferta aceptada.',
        addressText: 'San Martin de los Andes',
        desiredTime: null,
        photoPathnames: [],
        status: JobPostStatus.IN_PROGRESS,
        createdAt: new Date('2026-05-13T00:00:00.000Z')
      },
      {
        id: 'job_new',
        title: 'Trabajo nuevo',
        category: 'electricidad',
        description: 'Instalacion nueva.',
        addressText: 'San Martin de los Andes',
        desiredTime: null,
        photoPathnames: [],
        status: JobPostStatus.PUBLISHED,
        createdAt: new Date('2026-05-14T00:00:00.000Z')
      }
    ];
    const findMany = vi.fn().mockResolvedValue(jobPosts);

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        findMany
      }
    } as never);

    await expect(listActiveClientJobPosts('user_001')).resolves.toEqual(jobPosts);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        clientId: 'user_001',
        status: {
          in: [JobPostStatus.PUBLISHED, JobPostStatus.IN_PROGRESS, JobPostStatus.READY_FOR_REVIEW]
        }
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
        photoPathnames: true,
        status: true,
        createdAt: true
      }
    });
  });

  it('lists every published job post with worker category matches first', async () => {
    const jobPosts: JobPostSummary[] = [
      {
        id: 'job_004',
        title: 'Cambio de toma corriente',
        category: 'construction',
        description: 'Cambiar una ficha hembra.',
        addressText: 'Salta Capital',
        desiredTime: null,
        photoPathnames: [],
        status: JobPostStatus.PUBLISHED,
        createdAt: new Date('2026-05-14T00:00:00.000Z')
      },
      {
        id: 'job_003',
        title: 'Pintar rejas',
        category: 'painting',
        description: 'Pintar rejas del frente.',
        addressText: 'Salta Capital',
        desiredTime: null,
        photoPathnames: [],
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

    await expect(listPublishedWorkerJobPosts(['painting', 'cleaning'])).resolves.toEqual([jobPosts[1], jobPosts[0]]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        status: JobPostStatus.PUBLISHED
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
        photoPathnames: true,
        status: true,
        createdAt: true
      }
    });
  });

  it('finds active job posts only for the owning client', async () => {
    const jobPost: JobPostSummary = {
      id: 'job_001',
      title: 'Mural',
      category: 'painting',
      description: 'Pintar un mural exterior.',
      addressText: 'San Martin de los Andes',
      desiredTime: null,
      photoPathnames: [],
      status: JobPostStatus.PUBLISHED,
      createdAt: new Date('2026-05-13T00:00:00.000Z')
    };
    const findFirst = vi.fn().mockResolvedValue(jobPost);

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        findFirst
      }
    } as never);

    await expect(getActiveClientJobPost('user_001', 'job_001')).resolves.toEqual(jobPost);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'job_001',
        clientId: 'user_001',
        status: JobPostStatus.PUBLISHED
      },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        addressText: true,
        desiredTime: true,
        photoPathnames: true,
        status: true,
        createdAt: true
      }
    });
  });

  it('finds owned job detail across the client lifecycle but not cancelled jobs', async () => {
    const jobPost: JobPostSummary = {
      id: 'job_001',
      title: 'Mural',
      category: 'painting',
      description: 'Pintar un mural exterior.',
      addressText: 'San Martin de los Andes',
      desiredTime: null,
      photoPathnames: [],
      status: JobPostStatus.IN_PROGRESS,
      createdAt: new Date('2026-05-13T00:00:00.000Z')
    };
    const findFirst = vi.fn().mockResolvedValue(jobPost);

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        findFirst
      }
    } as never);

    await expect(getClientJobPostForDetail('user_001', 'job_001')).resolves.toEqual(jobPost);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'job_001',
        clientId: 'user_001',
        status: {
          in: [
            JobPostStatus.PUBLISHED,
            JobPostStatus.IN_PROGRESS,
            JobPostStatus.READY_FOR_REVIEW,
            JobPostStatus.CLOSED
          ]
        }
      },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        addressText: true,
        desiredTime: true,
        photoPathnames: true,
        status: true,
        createdAt: true
      }
    });
  });

  it('updates active job posts only through ready jefe auth and owner scope', async () => {
    const updateMany = vi.fn().mockResolvedValue({
      count: 1
    });
    const findFirst = vi.fn().mockResolvedValue({
      id: 'job_001',
      title: 'Mural renovado',
      category: 'painting',
      description: 'Pintar un mural exterior con dos colores.',
      addressText: 'San Martin de los Andes',
      desiredTime: null,
      photoPathnames: [],
      status: JobPostStatus.PUBLISHED,
      createdAt: new Date('2026-05-13T00:00:00.000Z')
    });

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        updateMany,
        findFirst
      }
    } as never);

    const result = await updateAuthenticatedClientJobPost(activeJefeAuth, 'job_001', {
      title: ' Mural renovado ',
      category: 'painting',
      description: ' Pintar un mural exterior con dos colores. ',
      addressText: ' San Martin de los Andes '
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      jobPost: {
        id: 'job_001',
        title: 'Mural renovado',
        category: 'painting',
        description: 'Pintar un mural exterior con dos colores.',
        addressText: 'San Martin de los Andes',
        desiredTime: null,
        photoPathnames: [],
        status: JobPostStatus.PUBLISHED,
        createdAt: new Date('2026-05-13T00:00:00.000Z')
      }
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 'job_001',
        clientId: 'user_001',
        status: JobPostStatus.PUBLISHED
      },
      data: {
        title: 'Mural renovado',
        category: 'painting',
        description: 'Pintar un mural exterior con dos colores.',
        addressText: 'San Martin de los Andes',
        desiredTime: null
      }
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'job_001',
        clientId: 'user_001',
        status: JobPostStatus.PUBLISHED
      },
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        addressText: true,
        desiredTime: true,
        photoPathnames: true,
        status: true,
        createdAt: true
      }
    });
  });
});
