import { IdentityVerificationStatus, JobOfferStatus, JobPostStatus, UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { getClientWorkerHistory, listClientAcceptedWorkers } from '@/lib/client-workers';
import { getPrismaClient } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const getPrismaClientMock = vi.mocked(getPrismaClient);

afterEach(() => {
  vi.resetAllMocks();
});

describe('client worker history', () => {
  it('lists distinct accepted workers for the current client newest first', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'offer_newer',
        amountCents: 2000000,
        updatedAt: new Date('2026-05-13T12:00:00.000Z'),
        worker: {
          id: 'worker_001',
          email: 'ana@yavaa.test',
          displayName: null,
          profile: {
            firstName: 'Ana',
            lastName: 'Diaz',
            avatarUrl: 'profiles/worker_001/avatars/ana.jpg',
            workerCategories: ['painting']
          }
        },
        jobPost: {
          id: 'job_newer',
          title: 'Pintar cocina',
          status: JobPostStatus.IN_PROGRESS,
          updatedAt: new Date('2026-05-13T12:00:00.000Z')
        },
        _count: {
          messages: 3,
          payments: 1
        }
      },
      {
        id: 'offer_older_same_worker',
        amountCents: 1000000,
        updatedAt: new Date('2026-05-12T12:00:00.000Z'),
        worker: {
          id: 'worker_001',
          email: 'ana@yavaa.test',
          displayName: null,
          profile: {
            firstName: 'Ana',
            lastName: 'Diaz',
            avatarUrl: 'profiles/worker_001/avatars/ana.jpg',
            workerCategories: ['painting']
          }
        },
        jobPost: {
          id: 'job_older',
          title: 'Pintar puerta',
          status: JobPostStatus.CLOSED,
          updatedAt: new Date('2026-05-12T12:00:00.000Z')
        },
        _count: {
          messages: 2,
          payments: 2
        }
      }
    ]);

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findMany
      }
    } as never);

    await expect(listClientAcceptedWorkers('client_001')).resolves.toEqual([
      {
        id: 'worker_001',
        displayName: 'Ana D.',
        avatarUrl: 'profiles/worker_001/avatars/ana.jpg',
        categories: ['painting'],
        acceptedJobsCount: 2,
        lastJobTitle: 'Pintar cocina',
        lastInteractionAt: new Date('2026-05-13T12:00:00.000Z'),
        totalMessagesCount: 5,
        totalPaymentsCount: 3
      }
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        status: JobOfferStatus.ACCEPTED,
        jobPost: {
          clientId: 'client_001',
          status: {
            in: [JobPostStatus.IN_PROGRESS, JobPostStatus.READY_FOR_REVIEW, JobPostStatus.CLOSED]
          }
        },
        worker: {
          status: UserStatus.ACTIVE
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: expect.any(Object),
      take: 40
    });
  });

  it('returns a worker profile only when the client has accepted work with that worker', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: 'worker_001',
      email: 'ana@yavaa.test',
      displayName: null,
      status: UserStatus.ACTIVE,
      profile: {
        firstName: 'Ana',
        lastName: 'Diaz',
        avatarUrl: null,
        bio: 'Pintura fina y mantenimiento.',
        workerCategories: ['painting'],
        workerHourlyRateCents: 450000,
        identityVerificationStatus: IdentityVerificationStatus.VERIFIED,
        addressText: 'Salta Capital'
      },
      jobOffers: [
        {
          id: 'offer_001',
          amountCents: 2000000,
          status: JobOfferStatus.ACCEPTED,
          createdAt: new Date('2026-05-13T12:00:00.000Z'),
          updatedAt: new Date('2026-05-13T12:00:00.000Z'),
          jobPost: {
            id: 'job_001',
            title: 'Pintar cocina',
            category: 'painting',
            status: JobPostStatus.IN_PROGRESS,
            createdAt: new Date('2026-05-13T10:00:00.000Z')
          },
          _count: {
            messages: 3,
            payments: 1
          }
        }
      ]
    });

    getPrismaClientMock.mockReturnValue({
      user: {
        findFirst
      }
    } as never);

    await expect(getClientWorkerHistory('client_001', 'worker_001')).resolves.toEqual({
      id: 'worker_001',
      displayName: 'Ana D.',
      avatarUrl: null,
      bio: 'Pintura fina y mantenimiento.',
      categories: ['painting'],
      hourlyRateCents: 450000,
      identityVerificationStatus: IdentityVerificationStatus.VERIFIED,
      addressText: 'Salta Capital',
      history: [
        {
          offerId: 'offer_001',
          jobPostId: 'job_001',
          title: 'Pintar cocina',
          category: 'painting',
          status: JobPostStatus.IN_PROGRESS,
          amountCents: 2000000,
          messagesCount: 3,
          paymentsCount: 1,
          createdAt: new Date('2026-05-13T10:00:00.000Z'),
          updatedAt: new Date('2026-05-13T12:00:00.000Z')
        }
      ]
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        id: 'worker_001',
        status: UserStatus.ACTIVE,
        jobOffers: {
          some: {
            status: JobOfferStatus.ACCEPTED,
            jobPost: {
              clientId: 'client_001',
              status: {
                in: [JobPostStatus.IN_PROGRESS, JobPostStatus.READY_FOR_REVIEW, JobPostStatus.CLOSED]
              }
            }
          }
        }
      },
      select: expect.any(Object)
    });
  });
});
