import { JobOfferStatus, JobPostStatus, UserStatus } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  acceptJobOffer,
  addOfferMessage,
  createJobOfferSchema,
  createJobOffer,
  createJobPaymentSchema,
  createJobPayment,
  getWorkerJobPostForDetail,
  listJobPayments,
  listClientJobOffers,
  listOfferMessages,
  markJobOfferReady,
  rejectJobOffer,
  reviewReadyJobOffer
} from '@/lib/job-offers';
import { getPrismaClient } from '@/lib/prisma';
import type { RequestAuthState } from '@/lib/request-auth';

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const getPrismaClientMock = vi.mocked(getPrismaClient);
const jobPostId = '11111111-1111-4111-8111-111111111111';

const activeWorkerAuth = {
  authenticated: true,
  configured: true,
  reason: null,
  identity: {
    id: 'auth_worker_001',
    email: 'worker@yavaa.test'
  },
  matchedBy: 'supabase_auth_id',
  appUser: {
    id: 'worker_001',
    email: 'worker@yavaa.test',
    supabaseAuthId: 'auth_worker_001',
    displayName: null,
    status: UserStatus.ACTIVE,
    roles: ['trabajador'],
    profile: {
      firstName: 'Ana',
      lastName: 'Diaz',
      avatarUrl: null,
      phone: null,
      bio: null,
      onboardingRole: null,
      workerOnboardingCompletedAt: new Date('2026-05-12T00:00:00.000Z'),
      jefeOnboardingCompletedAt: null,
      identityVerificationStatus: 'NOT_STARTED',
      dniNumber: null,
      workerCategories: ['painting'],
      workerHourlyRateCents: null,
      addressText: 'Salta Capital',
      locationLatitude: null,
      locationLongitude: null
    }
  },
  permissionContext: {
    userId: 'worker_001',
    status: UserStatus.ACTIVE,
    roles: ['trabajador']
  }
} satisfies RequestAuthState;

const activeClientAuth = {
  authenticated: true,
  configured: true,
  reason: null,
  identity: {
    id: 'auth_client_001',
    email: 'client@yavaa.test'
  },
  matchedBy: 'supabase_auth_id',
  appUser: {
    id: 'client_001',
    email: 'client@yavaa.test',
    supabaseAuthId: 'auth_client_001',
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
    userId: 'client_001',
    status: UserStatus.ACTIVE,
    roles: ['jefe']
  }
} satisfies RequestAuthState;

const unrelatedWorkerAuth = {
  ...activeWorkerAuth,
  appUser: {
    ...activeWorkerAuth.appUser,
    id: 'worker_999',
    email: 'other-worker@yavaa.test',
    supabaseAuthId: 'auth_worker_999'
  },
  permissionContext: {
    userId: 'worker_999',
    status: UserStatus.ACTIVE,
    roles: ['trabajador']
  }
} satisfies RequestAuthState;

const publishedJobPost = {
  id: jobPostId,
  clientId: 'client_001',
  title: 'Pintar una habitación',
  category: 'painting',
  description: 'Necesito pintar una habitación chica.',
  addressText: 'Salta Capital',
  desiredTime: null,
  photoPathnames: [],
  status: JobPostStatus.PUBLISHED,
  createdAt: new Date('2026-05-13T00:00:00.000Z')
};

const pendingOffer = {
  id: 'offer_001',
  jobPostId,
  workerId: 'worker_001',
  amountCents: 1250000,
  status: JobOfferStatus.PENDING,
  createdAt: new Date('2026-05-13T01:00:00.000Z'),
  updatedAt: new Date('2026-05-13T01:00:00.000Z'),
  jobPost: publishedJobPost
};

const acceptedOffer = {
  ...pendingOffer,
  status: JobOfferStatus.ACCEPTED,
  jobPost: {
    ...publishedJobPost,
    status: JobPostStatus.IN_PROGRESS,
    acceptedOfferId: 'offer_001'
  }
};

afterEach(() => {
  vi.resetAllMocks();
});

describe('job offer service', () => {
  it('validates offer schema fields with plan messages', () => {
    const result = createJobOfferSchema.safeParse({
      jobPostId: 'not-a-uuid',
      amountPesos: 12.5
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        jobPostId: ['Elegí un trabajo válido.'],
        amountPesos: ['Ingresá un monto entero.']
      });
    }
  });

  it('validates payment schema fields with plan messages', () => {
    const result = createJobPaymentSchema.safeParse({
      amountPesos: 0,
      paidAt: 'mañana',
      description: ''
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors).toMatchObject({
        amountPesos: ['Ingresá un monto mayor a 0.'],
        paidAt: ['Elegí una fecha válida.'],
        description: ['Agregá una descripción.']
      });
    }

    const tooLongDescription = createJobPaymentSchema.safeParse({
      amountPesos: 1000,
      paidAt: '2026-05-13T03:00:00.000Z',
      description: 'a'.repeat(241)
    });

    expect(tooLongDescription.success).toBe(false);
    if (!tooLongDescription.success) {
      expect(tooLongDescription.error.flatten().fieldErrors).toMatchObject({
        description: ['Usá 240 caracteres o menos.']
      });
    }

    const overflowingAmount = createJobOfferSchema.safeParse({
      jobPostId,
      amountPesos: 21_474_837
    });

    expect(overflowingAmount.success).toBe(false);
    if (!overflowingAmount.success) {
      expect(overflowingAmount.error.flatten().fieldErrors).toMatchObject({
        amountPesos: ['El monto es demasiado alto.']
      });
    }
  });

  it('creates a pending offer and initial worker message for ready worker users', async () => {
    const lockPublishedJob = vi.fn().mockResolvedValue([{ id: jobPostId }]);
    const upsert = vi.fn().mockResolvedValue({
      id: 'offer_001',
      jobPostId,
      workerId: 'worker_001',
      amountCents: 1250000,
      status: JobOfferStatus.PENDING,
      createdAt: new Date('2026-05-13T01:00:00.000Z'),
      updatedAt: new Date('2026-05-13T01:00:00.000Z')
    });
    const create = vi.fn().mockResolvedValue({
      id: 'message_001',
      offerId: 'offer_001',
      authorId: 'worker_001',
      body: 'Puedo hacerlo mañana.',
      createdAt: new Date('2026-05-13T01:01:00.000Z')
    });
    const transaction = vi.fn(async (callback) =>
      callback({
        $queryRaw: lockPublishedJob,
        jobOffer: {
          upsert
        },
        jobOfferMessage: {
          create
        }
      })
    );

    getPrismaClientMock.mockReturnValue({
      $transaction: transaction
    } as never);

    const result = await createJobOffer(activeWorkerAuth, {
      jobPostId,
      amountPesos: 12500,
      message: '  Puedo hacerlo mañana. '
    });

    expect(result).toEqual({
      ok: true,
      status: 200,
      offer: {
        id: 'offer_001',
        jobPostId,
        workerId: 'worker_001',
        amountCents: 1250000,
        status: JobOfferStatus.PENDING
      }
    });
    expect(lockPublishedJob).toHaveBeenCalledTimes(1);
    expect(String(lockPublishedJob.mock.calls[0]?.[0])).toContain('FOR UPDATE');
    expect(String(lockPublishedJob.mock.calls[0]?.[0])).toContain('"JobPostStatus"');
    expect(lockPublishedJob.mock.invocationCallOrder[0]).toBeLessThan(upsert.mock.invocationCallOrder[0]);
    expect(upsert).toHaveBeenCalledWith({
      where: {
        jobPostId_workerId: {
          jobPostId,
          workerId: 'worker_001'
        }
      },
      create: {
        jobPostId,
        workerId: 'worker_001',
        amountCents: 1250000,
        status: JobOfferStatus.PENDING
      },
      update: {
        amountCents: 1250000,
        status: JobOfferStatus.PENDING
      },
      select: expect.any(Object)
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        offerId: 'offer_001',
        authorId: 'worker_001',
        body: 'Puedo hacerlo mañana.'
      },
      select: expect.any(Object)
    });
    expect(transaction).toHaveBeenCalledTimes(1);
  });

  it('rejects workers without completed trabajador onboarding', async () => {
    const result = await createJobOffer(
      {
        ...activeWorkerAuth,
        appUser: {
          ...activeWorkerAuth.appUser,
          profile: {
            ...activeWorkerAuth.appUser.profile,
            workerOnboardingCompletedAt: null
          }
        }
      },
      {
        jobPostId,
        amountPesos: 12500
      }
    );

    expect(result).toEqual({
      ok: false,
      status: 403,
      message: 'Completá tu perfil de trabajador para ofertar.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('only creates offers on published jobs', async () => {
    const lockPublishedJob = vi.fn().mockResolvedValue([]);
    const upsert = vi.fn();
    const transaction = vi.fn(async (callback) =>
      callback({
        $queryRaw: lockPublishedJob,
        jobOffer: {
          upsert
        }
      })
    );

    getPrismaClientMock.mockReturnValue({
      $transaction: transaction
    } as never);

    const result = await createJobOffer(activeWorkerAuth, {
      jobPostId,
      amountPesos: 12500
    });

    expect(result).toEqual({
      ok: false,
      status: 404,
      message: 'No encontramos ese trabajo publicado.'
    });
    expect(upsert).not.toHaveBeenCalled();
    expect(lockPublishedJob).toHaveBeenCalledTimes(1);
  });

  it('accepts one offer, moves the job to IN_PROGRESS, and rejects competing offers', async () => {
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const offerUpdateMany = vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 2 });
    const acceptedOfferFindUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED
    });
    const jobPostUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const transaction = vi.fn(async (callback) =>
      callback({
        jobOffer: {
          updateMany: offerUpdateMany,
          findUnique: acceptedOfferFindUnique
        },
        jobPost: {
          updateMany: jobPostUpdateMany
        }
      })
    );

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: transaction
    } as never);

    const result = await acceptJobOffer(activeClientAuth, 'offer_001');

    expect(result).toEqual({
      ok: true,
      status: 200,
      offer: {
        id: 'offer_001',
        jobPostId,
        workerId: 'worker_001',
        amountCents: 1250000,
        status: JobOfferStatus.ACCEPTED
      }
    });
    expect(jobPostUpdateMany).toHaveBeenCalledWith({
      where: {
        id: jobPostId,
        clientId: 'client_001',
        status: JobPostStatus.PUBLISHED,
        acceptedOfferId: null
      },
      data: {
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: 'offer_001'
      }
    });
    expect(offerUpdateMany).toHaveBeenNthCalledWith(1, {
      where: {
        id: 'offer_001',
        jobPostId,
        status: JobOfferStatus.PENDING
      },
      data: {
        status: JobOfferStatus.ACCEPTED
      }
    });
    expect(offerUpdateMany).toHaveBeenNthCalledWith(2, {
      where: {
        jobPostId,
        id: {
          not: 'offer_001'
        },
        status: JobOfferStatus.PENDING
      },
      data: {
        status: JobOfferStatus.REJECTED
      }
    });
    expect(acceptedOfferFindUnique).toHaveBeenCalledWith({
      where: {
        id: 'offer_001'
      },
      select: expect.any(Object)
    });
    expect(jobPostUpdateMany.mock.invocationCallOrder[0]).toBeLessThan(offerUpdateMany.mock.invocationCallOrder[0]);
  });

  it('returns 409 when accepting loses guarded offer or job updates', async () => {
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const jobPostUpdateManyLoses = vi.fn().mockResolvedValue({ count: 0 });
    const jobPostUpdateManyWins = vi.fn().mockResolvedValue({ count: 1 });
    const offerUpdateManyAfterLostJob = vi.fn();
    const offerUpdateManyLoses = vi.fn().mockResolvedValue({ count: 0 });
    const transaction = vi
      .fn()
      .mockImplementationOnce(async (callback) =>
        callback({
          jobOffer: {
            updateMany: offerUpdateManyAfterLostJob
          },
          jobPost: {
            updateMany: jobPostUpdateManyLoses
          }
        })
      )
      .mockImplementationOnce(async (callback) =>
        callback({
          jobOffer: {
            updateMany: offerUpdateManyLoses
          },
          jobPost: {
            updateMany: jobPostUpdateManyWins
          }
        })
      );

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: transaction
    } as never);

    await expect(acceptJobOffer(activeClientAuth, 'offer_001')).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'Esta oferta ya no se puede aceptar.'
    });
    expect(offerUpdateManyAfterLostJob).not.toHaveBeenCalled();
    await expect(acceptJobOffer(activeClientAuth, 'offer_001')).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'Esta oferta ya no se puede aceptar.'
    });
  });

  it('rejects a pending offer for the client owner', async () => {
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique,
        updateMany
      }
    } as never);

    const result = await rejectJobOffer(activeClientAuth, 'offer_001');

    expect(result).toEqual({
      ok: true,
      status: 200,
      offer: {
        id: 'offer_001',
        jobPostId,
        workerId: 'worker_001',
        amountCents: 1250000,
        status: JobOfferStatus.REJECTED
      }
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 'offer_001',
        status: JobOfferStatus.PENDING
      },
      data: {
        status: JobOfferStatus.REJECTED
      }
    });
  });

  it('returns 409 without overwriting accepted offers when reject guarded update loses', async () => {
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique,
        updateMany
      }
    } as never);

    await expect(rejectJobOffer(activeClientAuth, 'offer_001')).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'Esta oferta ya no se puede rechazar.'
    });
  });

  it('lets the client and accepted worker add chat messages', async () => {
    const findUnique = vi.fn().mockResolvedValue(acceptedOffer);
    const create = vi.fn().mockResolvedValue({
      id: 'message_002',
      offerId: 'offer_001',
      authorId: 'client_001',
      body: 'Avancemos.',
      createdAt: new Date('2026-05-13T02:00:00.000Z')
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobOfferMessage: {
        create
      }
    } as never);

    await expect(
      addOfferMessage(activeClientAuth, 'offer_001', {
        body: ' Avancemos. '
      })
    ).resolves.toMatchObject({
      ok: true,
      message: {
        authorId: 'client_001',
        body: 'Avancemos.'
      }
    });

    create.mockResolvedValueOnce({
      id: 'message_003',
      offerId: 'offer_001',
      authorId: 'worker_001',
      body: 'Perfecto.',
      createdAt: new Date('2026-05-13T02:01:00.000Z')
    });

    await expect(
      addOfferMessage(activeWorkerAuth, 'offer_001', {
        body: ' Perfecto. '
      })
    ).resolves.toMatchObject({
      ok: true,
      message: {
        authorId: 'worker_001',
        body: 'Perfecto.'
      }
    });
  });

  it('blocks unrelated users from offer messages and payments', async () => {
    const findUnique = vi.fn().mockResolvedValue(acceptedOffer);

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      }
    } as never);

    await expect(listOfferMessages(unrelatedWorkerAuth, 'offer_001')).resolves.toEqual({
      ok: false,
      status: 403,
      message: 'No tenés permiso para ver esta oferta.'
    });
    await expect(listJobPayments(unrelatedWorkerAuth, 'offer_001')).resolves.toEqual({
      ok: false,
      status: 403,
      message: 'No tenés permiso para ver esta oferta.'
    });
    await expect(
      createJobPayment(unrelatedWorkerAuth, 'offer_001', {
        amountPesos: 5000,
        paidAt: '2026-05-13T03:00:00.000Z',
        description: 'Seña'
      })
    ).resolves.toEqual({
      ok: false,
      status: 403,
      message: 'No tenés permiso para ver esta oferta.'
    });
  });

  it('rejects listing payments for pending or unaccepted offers', async () => {
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce(pendingOffer)
      .mockResolvedValueOnce({
        ...acceptedOffer,
        jobPost: {
          ...acceptedOffer.jobPost,
          acceptedOfferId: 'offer_999'
        }
      });
    const findMany = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobPayment: {
        findMany
      }
    } as never);

    await expect(listJobPayments(activeClientAuth, 'offer_001')).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'Solo se pueden registrar pagos en ofertas aceptadas.'
    });
    await expect(listJobPayments(activeClientAuth, 'offer_001')).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'Solo se pueden registrar pagos en ofertas aceptadas.'
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('rejects listing payments when the accepted job has a wrong status', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      ...acceptedOffer,
      jobPost: {
        ...acceptedOffer.jobPost,
        status: JobPostStatus.PUBLISHED
      }
    });
    const findMany = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobPayment: {
        findMany
      }
    } as never);

    await expect(listJobPayments(activeClientAuth, 'offer_001')).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'El trabajo no está listo para registrar pagos.'
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('lists payments for accepted jobs in progress or ready for review', async () => {
    const payments = [
      {
        id: 'payment_001',
        offerId: 'offer_001',
        createdById: 'client_001',
        amountCents: 500000,
        paidAt: new Date('2026-05-13T03:00:00.000Z'),
        description: 'Seña',
        receiptPathname: null,
        createdAt: new Date('2026-05-13T03:01:00.000Z')
      }
    ];
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce(acceptedOffer)
      .mockResolvedValueOnce({
        ...acceptedOffer,
        jobPost: {
          ...acceptedOffer.jobPost,
          status: JobPostStatus.READY_FOR_REVIEW
        }
      });
    const findMany = vi.fn().mockResolvedValue(payments);

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobPayment: {
        findMany
      }
    } as never);

    await expect(listJobPayments(activeClientAuth, 'offer_001')).resolves.toEqual({
      ok: true,
      status: 200,
      payments
    });
    await expect(listJobPayments(activeWorkerAuth, 'offer_001')).resolves.toEqual({
      ok: true,
      status: 200,
      payments
    });
    expect(findMany).toHaveBeenCalledTimes(2);
  });

  it('lets the client and accepted worker register internal payments and stores createdById', async () => {
    const findUnique = vi.fn().mockResolvedValue(acceptedOffer);
    const lockPaymentJob = vi.fn().mockResolvedValue([{ id: jobPostId }]);
    const create = vi.fn().mockResolvedValue({
      id: 'payment_001',
      offerId: 'offer_001',
      createdById: 'client_001',
      amountCents: 500000,
      paidAt: new Date('2026-05-13T03:00:00.000Z'),
      description: 'Seña',
      receiptPathname: null,
      createdAt: new Date('2026-05-13T03:01:00.000Z')
    });
    const transaction = vi.fn(async (callback) =>
      callback({
        $queryRaw: lockPaymentJob,
        jobPayment: {
          create
        }
      })
    );

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: transaction
    } as never);

    await expect(
      createJobPayment(activeClientAuth, 'offer_001', {
        amountPesos: 5000,
        paidAt: '2026-05-13T03:00:00.000Z',
        description: ' Seña ',
        receiptPathname: null
      })
    ).resolves.toMatchObject({
      ok: true,
      payment: {
        createdById: 'client_001',
        amountCents: 500000,
        description: 'Seña'
      }
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        offerId: 'offer_001',
        createdById: 'client_001',
        amountCents: 500000,
        paidAt: new Date('2026-05-13T03:00:00.000Z'),
        description: 'Seña',
        receiptPathname: null
      },
      select: expect.any(Object)
    });
    expect(lockPaymentJob).toHaveBeenCalledTimes(1);
    expect(String(lockPaymentJob.mock.calls[0]?.[0])).toContain('FOR UPDATE');
    expect(lockPaymentJob.mock.invocationCallOrder[0]).toBeLessThan(create.mock.invocationCallOrder[0]);

    create.mockResolvedValueOnce({
      id: 'payment_002',
      offerId: 'offer_001',
      createdById: 'worker_001',
      amountCents: 750000,
      paidAt: new Date('2026-05-14T03:00:00.000Z'),
      description: 'Materiales',
      receiptPathname: 'job-offers/offer_001/payments/worker_001/comprobante.jpg',
      createdAt: new Date('2026-05-14T03:01:00.000Z')
    });

    await expect(
      createJobPayment(activeWorkerAuth, 'offer_001', {
        amountPesos: 7500,
        paidAt: '2026-05-14T03:00:00.000Z',
        description: 'Materiales',
        receiptPathname: 'job-offers/offer_001/payments/worker_001/comprobante.jpg'
      })
    ).resolves.toMatchObject({
      ok: true,
      payment: {
        createdById: 'worker_001',
        amountCents: 750000,
        receiptPathname: 'job-offers/offer_001/payments/worker_001/comprobante.jpg'
      }
    });
    expect(transaction).toHaveBeenCalledTimes(2);
  });

  it('returns a form payment validation error for non-object payment bodies', async () => {
    const findUnique = vi.fn().mockResolvedValue(acceptedOffer);
    const transaction = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: transaction
    } as never);

    await expect(createJobPayment(activeClientAuth, 'offer_001', null)).resolves.toEqual({
      ok: false,
      status: 422,
      message: 'Revisá los datos del pago.',
      fieldErrors: {
        form: ['Completá los datos del pago.']
      }
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('rejects payment receipt paths outside the current offer or user namespace before creating payment', async () => {
    const findUnique = vi.fn().mockResolvedValue(acceptedOffer);
    const transaction = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: transaction
    } as never);

    for (const receiptPathname of [
      'job-offers/offer_999/payments/worker_001/comprobante.jpg',
      'job-offers/offer_001/payments/client_001/comprobante.jpg',
      'receipts/payment_002.jpg'
    ]) {
      await expect(
        createJobPayment(activeWorkerAuth, 'offer_001', {
          amountPesos: 7500,
          paidAt: '2026-05-14T03:00:00.000Z',
          description: 'Materiales',
          receiptPathname
        })
      ).resolves.toEqual({
        ok: false,
        status: 422,
        message: 'Revisá los datos del pago.',
        fieldErrors: {
          receiptPathname: ['Subí un comprobante válido.']
        }
      });
    }

    expect(transaction).not.toHaveBeenCalled();
  });

  it('returns 409 and does not create payment when the transaction guard finds no payable job', async () => {
    const findUnique = vi.fn().mockResolvedValue(acceptedOffer);
    const lockPaymentJob = vi.fn().mockResolvedValue([]);
    const create = vi.fn();
    const transaction = vi.fn(async (callback) =>
      callback({
        $queryRaw: lockPaymentJob,
        jobPayment: {
          create
        }
      })
    );

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: transaction
    } as never);

    await expect(
      createJobPayment(activeClientAuth, 'offer_001', {
        amountPesos: 5000,
        paidAt: '2026-05-13T03:00:00.000Z',
        description: 'Seña'
      })
    ).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'El trabajo no está listo para registrar pagos.'
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 409 when marking ready loses the guarded job update', async () => {
    const findUnique = vi.fn().mockResolvedValue(acceptedOffer);
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobPost: {
        updateMany
      }
    } as never);

    await expect(markJobOfferReady(activeWorkerAuth, 'offer_001')).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'El trabajo no está en progreso.'
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: jobPostId,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: 'offer_001'
      },
      data: {
        status: JobPostStatus.READY_FOR_REVIEW
      }
    });
  });

  it('includes oldest-first recent messages when listing client job offers', async () => {
    const findFirst = vi.fn().mockResolvedValue({
      id: jobPostId
    });
    const newestMessage = {
      id: 'message_003',
      offerId: 'offer_001',
      authorId: 'client_001',
      body: 'Mensaje nuevo.',
      createdAt: new Date('2026-05-13T03:00:00.000Z')
    };
    const olderMessage = {
      id: 'message_002',
      offerId: 'offer_001',
      authorId: 'worker_001',
      body: 'Mensaje anterior.',
      createdAt: new Date('2026-05-13T02:00:00.000Z')
    };
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'offer_001',
        jobPostId,
        workerId: 'worker_001',
        amountCents: 1250000,
        status: JobOfferStatus.PENDING,
        createdAt: new Date('2026-05-13T01:00:00.000Z'),
        updatedAt: new Date('2026-05-13T01:00:00.000Z'),
        worker: {
          id: 'worker_001',
          email: 'worker@yavaa.test',
          displayName: null,
          profile: null
        },
        _count: {
          messages: 2,
          payments: 0
        },
        messages: [newestMessage, olderMessage]
      }
    ]);

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        findFirst
      },
      jobOffer: {
        findMany
      }
    } as never);

    await expect(listClientJobOffers('client_001', jobPostId)).resolves.toMatchObject([
      {
        id: 'offer_001',
        messages: [olderMessage, newestMessage]
      }
    ]);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          jobPostId
        },
        select: expect.objectContaining({
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            select: expect.any(Object),
            take: 25
          }
        })
      })
    );
  });

  it('includes the worker accepted offer with messages and payments on worker job detail', async () => {
    const olderMessage = {
      id: 'message_001',
      offerId: 'offer_001',
      authorId: 'worker_001',
      body: 'Puedo hacerlo mañana.',
      createdAt: new Date('2026-05-13T01:00:00.000Z')
    };
    const newestMessage = {
      id: 'message_002',
      offerId: 'offer_001',
      authorId: 'client_001',
      body: 'Dale, avanzamos.',
      createdAt: new Date('2026-05-13T02:00:00.000Z')
    };
    const payment = {
      id: 'payment_001',
      offerId: 'offer_001',
      createdById: 'client_001',
      amountCents: 500000,
      paidAt: new Date('2026-05-13T03:00:00.000Z'),
      description: 'Seña',
      receiptPathname: null,
      createdAt: new Date('2026-05-13T03:05:00.000Z')
    };
    const jobPost = {
      ...publishedJobPost,
      status: JobPostStatus.IN_PROGRESS,
      acceptedOffer: {
        id: 'offer_001',
        jobPostId,
        workerId: 'worker_001',
        amountCents: 1250000,
        status: JobOfferStatus.ACCEPTED,
        messages: [olderMessage, newestMessage],
        payments: [payment]
      }
    };
    const findFirst = vi.fn().mockResolvedValue(jobPost);

    getPrismaClientMock.mockReturnValue({
      jobPost: {
        findFirst
      }
    } as never);

    await expect(getWorkerJobPostForDetail('worker_001', jobPostId)).resolves.toEqual(jobPost);
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: jobPostId,
          OR: expect.arrayContaining([
            {
              status: {
                in: [JobPostStatus.IN_PROGRESS, JobPostStatus.READY_FOR_REVIEW, JobPostStatus.CLOSED]
              },
              acceptedOffer: {
                is: {
                  workerId: 'worker_001',
                  status: JobOfferStatus.ACCEPTED
                }
              }
            }
          ])
        }),
        select: expect.objectContaining({
          acceptedOffer: {
            select: expect.objectContaining({
              messages: {
                orderBy: {
                  createdAt: 'asc'
                },
                select: expect.any(Object),
                take: 25
              },
              payments: {
                orderBy: {
                  paidAt: 'desc'
                },
                select: expect.any(Object)
              }
            })
          }
        })
      })
    );
  });

  it('supports the ready and review workflow for close and needs_changes', async () => {
    const readyOffer = {
      ...acceptedOffer,
      jobPost: {
        ...acceptedOffer.jobPost,
        status: JobPostStatus.READY_FOR_REVIEW
      }
    };
    const findUnique = vi.fn().mockResolvedValueOnce(acceptedOffer).mockResolvedValueOnce(readyOffer).mockResolvedValueOnce(readyOffer);
    const markReadyJobPostUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const create = vi.fn().mockResolvedValue({
      id: 'message_004',
      offerId: 'offer_001',
      authorId: 'client_001',
      body: 'Falta una mano de pintura.',
      createdAt: new Date('2026-05-13T04:00:00.000Z')
    });
    const reviewJobPostUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const reviewTransaction = vi.fn(async (callback) =>
      callback({
        jobPost: {
          updateMany: reviewJobPostUpdateMany
        },
        jobOfferMessage: {
          create
        }
      })
    );

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: reviewTransaction,
      jobPost: {
        updateMany: markReadyJobPostUpdateMany
      }
    } as never);

    await expect(markJobOfferReady(activeWorkerAuth, 'offer_001')).resolves.toEqual({
      ok: true,
      status: 200,
      jobPost: {
        id: jobPostId,
        status: JobPostStatus.READY_FOR_REVIEW
      }
    });
    expect(markReadyJobPostUpdateMany).toHaveBeenCalledWith({
      where: {
        id: jobPostId,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: 'offer_001'
      },
      data: {
        status: JobPostStatus.READY_FOR_REVIEW
      }
    });

    await expect(reviewReadyJobOffer(activeClientAuth, 'offer_001', { action: 'close' })).resolves.toEqual({
      ok: true,
      status: 200,
      jobPost: {
        id: jobPostId,
        status: JobPostStatus.CLOSED
      }
    });

    await expect(
      reviewReadyJobOffer(activeClientAuth, 'offer_001', {
        action: 'needs_changes',
        message: ' Falta una mano de pintura. '
      })
    ).resolves.toEqual({
      ok: true,
      status: 200,
      jobPost: {
        id: jobPostId,
        status: JobPostStatus.IN_PROGRESS
      }
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        offerId: 'offer_001',
        authorId: 'client_001',
        body: 'Falta una mano de pintura.'
      },
      select: expect.any(Object)
    });
    expect(reviewJobPostUpdateMany).toHaveBeenCalledWith({
      where: {
        id: jobPostId,
        status: JobPostStatus.READY_FOR_REVIEW,
        acceptedOfferId: 'offer_001'
      },
      data: {
        status: JobPostStatus.IN_PROGRESS
      }
    });
  });

  it('returns 409 and does not create needs_changes message when review guarded transition loses', async () => {
    const readyOffer = {
      ...acceptedOffer,
      jobPost: {
        ...acceptedOffer.jobPost,
        status: JobPostStatus.READY_FOR_REVIEW
      }
    };
    const findUnique = vi.fn().mockResolvedValue(readyOffer);
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });
    const create = vi.fn();
    const transaction = vi.fn(async (callback) =>
      callback({
        jobPost: {
          updateMany
        },
        jobOfferMessage: {
          create
        }
      })
    );

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: transaction
    } as never);

    await expect(
      reviewReadyJobOffer(activeClientAuth, 'offer_001', {
        action: 'needs_changes',
        message: ' Falta una mano de pintura. '
      })
    ).resolves.toEqual({
      ok: false,
      status: 409,
      message: 'El trabajo no está listo para revisar.'
    });
    expect(create).not.toHaveBeenCalled();
  });
});
