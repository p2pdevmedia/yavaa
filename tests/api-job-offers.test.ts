import { put } from '@vercel/blob';
import { JobOfferStatus, JobPostStatus, UserStatus } from '@prisma/client';
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PATCH } from '@/app/api/job-offers/[offerId]/route';
import {
  GET as GET_OFFER_MESSAGES,
  POST as POST_OFFER_MESSAGE
} from '@/app/api/job-offers/[offerId]/messages/route';
import {
  GET as GET_OFFER_PAYMENTS,
  POST as POST_OFFER_PAYMENT
} from '@/app/api/job-offers/[offerId]/payments/route';
import { POST as POST_OFFER_PAYMENT_RECEIPT } from '@/app/api/job-offers/[offerId]/payments/receipts/route';
import { POST as POST_OFFER_READY } from '@/app/api/job-offers/[offerId]/ready/route';
import { POST as POST_OFFER_REVIEW } from '@/app/api/job-offers/[offerId]/review/route';
import { POST } from '@/app/api/job-offers/route';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';
import type { RequestAuthState } from '@/lib/request-auth';
import { jobPaymentReceiptMaxBytes } from '@/lib/job-payment-receipts';

vi.mock('@vercel/blob', () => ({
  put: vi.fn()
}));

vi.mock('@/lib/request-auth', () => ({
  resolveRequestAuth: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

const resolveRequestAuthMock = vi.mocked(resolveRequestAuth);
const getPrismaClientMock = vi.mocked(getPrismaClient);
const putMock = vi.mocked(put);
const jobPostId = '11111111-1111-4111-8111-111111111111';
const offerId = '22222222-2222-4222-8222-222222222222';
const pdfReceiptBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
const pngReceiptBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

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

const pendingOffer = {
  id: offerId,
  jobPostId,
  workerId: 'worker_001',
  amountCents: 980000,
  status: JobOfferStatus.PENDING,
  jobPost: {
    id: jobPostId,
    clientId: 'client_001',
    status: JobPostStatus.PUBLISHED,
    acceptedOfferId: null
  }
};

function createRequest(body: unknown) {
  return new NextRequest('http://localhost/api/job-offers', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  });
}

function createOfferActionRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/job-offers/${offerId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  });
}

function createOfferMessageRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/job-offers/${offerId}/messages`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  });
}

function createOfferMessagesGetRequest() {
  return new NextRequest(`http://localhost/api/job-offers/${offerId}/messages`, {
    method: 'GET'
  });
}

function createOfferPaymentRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/job-offers/${offerId}/payments`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  });
}

function createOfferReadyRequest() {
  return new NextRequest(`http://localhost/api/job-offers/${offerId}/ready`, {
    method: 'POST'
  });
}

function createOfferReviewRequest(body: unknown) {
  return new NextRequest(`http://localhost/api/job-offers/${offerId}/review`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'content-type': 'application/json'
    }
  });
}

function createOfferPaymentsGetRequest() {
  return new NextRequest(`http://localhost/api/job-offers/${offerId}/payments`, {
    method: 'GET'
  });
}

function createReceiptUploadRequest(file?: File | string) {
  const formData = new FormData();

  if (file !== undefined) {
    formData.set('file', file);
  }

  return new NextRequest(`http://localhost/api/job-offers/${offerId}/payments/receipts`, {
    method: 'POST',
    body: formData
  });
}

function createOfferRouteContext() {
  return {
    params: Promise.resolve({
      offerId
    })
  };
}

describe('/api/job-offers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_test');
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
      message: 'Iniciá sesión para ofertar.'
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('returns 400 for malformed JSON', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);

    const response = await POST(
      new NextRequest('http://localhost/api/job-offers', {
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
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 403 permission failures without field errors', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      ...activeWorkerAuth,
      appUser: {
        ...activeWorkerAuth.appUser,
        roles: ['jefe']
      },
      permissionContext: {
        userId: 'worker_001',
        status: UserStatus.ACTIVE,
        roles: ['jefe']
      }
    });

    const response = await POST(
      createRequest({
        jobPostId,
        amountPesos: 9800
      })
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'No tenés permiso para ofertar.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 422 field errors from offer validation', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);

    const response = await POST(
      createRequest({
        jobPostId: 'no-es-uuid',
        amountPesos: 12.5
      })
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá los datos de la oferta.',
      fieldErrors: {
        jobPostId: ['Elegí un trabajo válido.'],
        amountPesos: ['Ingresá un monto entero.']
      }
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 404 missing published jobs without field errors', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);
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

    const response = await POST(
      createRequest({
        jobPostId,
        amountPesos: 9800
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'No encontramos ese trabajo publicado.'
    });
    expect(upsert).not.toHaveBeenCalled();
  });

  it('creates a pending offer for completed worker users', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);
    const lockPublishedJob = vi.fn().mockResolvedValue([{ id: jobPostId }]);
    const upsert = vi.fn().mockResolvedValue({
      id: 'offer_001',
      jobPostId,
      workerId: 'worker_001',
      amountCents: 980000,
      status: JobOfferStatus.PENDING
    });
    const create = vi.fn().mockResolvedValue({
      id: 'message_001',
      offerId: 'offer_001',
      authorId: 'worker_001',
      body: 'Puedo ir esta semana.',
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

    const response = await POST(
      createRequest({
        jobPostId,
        amountPesos: 9800,
        message: 'Puedo ir esta semana.'
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      offer: {
        id: 'offer_001',
        jobPostId,
        workerId: 'worker_001',
        amountCents: 980000,
        status: 'PENDING'
      }
    });
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
        amountCents: 980000,
        status: JobOfferStatus.PENDING
      },
      update: {
        amountCents: 980000,
        status: JobOfferStatus.PENDING
      },
      select: expect.any(Object)
    });
    expect(create).toHaveBeenCalledOnce();
  });
});

describe('/api/job-offers/[offerId]/payments', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_test');
  });

  it('lists payments for offer participants', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'payment_001',
        offerId,
        createdById: 'client_001',
        amountCents: 500000,
        paidAt: new Date('2026-05-13T03:00:00.000Z'),
        description: 'Seña',
        receiptPathname: null,
        createdAt: new Date('2026-05-13T03:01:00.000Z')
      }
    ]);

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobPayment: {
        findMany
      }
    } as never);

    const response = await GET_OFFER_PAYMENTS(createOfferPaymentsGetRequest(), createOfferRouteContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      payments: [
        {
          id: 'payment_001',
          offerId,
          createdById: 'client_001',
          amountCents: 500000,
          paidAt: '2026-05-13T03:00:00.000Z',
          description: 'Seña',
          receiptPathname: null,
          createdAt: '2026-05-13T03:01:00.000Z'
        }
      ]
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('creates payments and returns validation errors for invalid payment bodies', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth).mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });
    const lockPaymentJob = vi.fn().mockResolvedValue([{ id: jobPostId }]);
    const create = vi.fn().mockResolvedValue({
      id: 'payment_001',
      offerId,
      createdById: 'client_001',
      amountCents: 500000,
      paidAt: new Date('2026-05-13T03:00:00.000Z'),
      description: 'Seña',
      receiptPathname: 'job-offers/22222222-2222-4222-8222-222222222222/payments/client_001/comprobante.jpg',
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

    const response = await POST_OFFER_PAYMENT(
      createOfferPaymentRequest({
        amountPesos: 5000,
        paidAt: '2026-05-13T03:00:00.000Z',
        description: ' Seña ',
        receiptPathname: 'job-offers/22222222-2222-4222-8222-222222222222/payments/client_001/comprobante.jpg'
      }),
      createOfferRouteContext()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      payment: {
        id: 'payment_001',
        createdById: 'client_001',
        amountCents: 500000,
        description: 'Seña'
      }
    });

    const invalidResponse = await POST_OFFER_PAYMENT(createOfferPaymentRequest(null), createOfferRouteContext());

    expect(invalidResponse.status).toBe(422);
    await expect(invalidResponse.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá los datos del pago.',
      fieldErrors: {
        form: ['Completá los datos del pago.']
      }
    });
  });

  it('returns 400 for malformed payment JSON', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);

    const response = await POST_OFFER_PAYMENT(
      new NextRequest(`http://localhost/api/job-offers/${offerId}/payments`, {
        method: 'POST',
        body: '{',
        headers: {
          'content-type': 'application/json'
        }
      }),
      createOfferRouteContext()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'El cuerpo del pedido no es JSON válido.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });
});

describe('/api/job-offers/[offerId]/payments/receipts', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', 'vercel_blob_rw_test');
  });

  it('requires authentication before uploading a private payment receipt', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce({
      authenticated: false,
      configured: true,
      reason: 'missing-token',
      identity: null,
      appUser: null,
      matchedBy: null,
      permissionContext: null
    });

    const response = await POST_OFFER_PAYMENT_RECEIPT(
      createReceiptUploadRequest(new File([pdfReceiptBytes], 'comprobante.pdf', { type: 'application/pdf' })),
      createOfferRouteContext()
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Iniciá sesión para ver esta oferta.'
    });
    expect(putMock).not.toHaveBeenCalled();
  });

  it('uploads private payment receipts for payable offers', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      }
    } as never);
    putMock.mockResolvedValueOnce({
      url: 'https://store.private.blob.vercel-storage.com/job-offers/receipt.pdf',
      downloadUrl: 'https://store.private.blob.vercel-storage.com/job-offers/receipt.pdf?download=1',
      pathname: `job-offers/${offerId}/payments/client_001/comprobante-random.pdf`,
      contentType: 'application/pdf',
      contentDisposition: 'attachment; filename="comprobante-random.pdf"',
      etag: '"etag"'
    });

    const response = await POST_OFFER_PAYMENT_RECEIPT(
      createReceiptUploadRequest(new File([pdfReceiptBytes], 'Comprobante.PDF', { type: 'application/pdf' })),
      createOfferRouteContext()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      pathname: `job-offers/${offerId}/payments/client_001/comprobante-random.pdf`
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(putMock).toHaveBeenCalledWith(
      `job-offers/${offerId}/payments/client_001/comprobante.pdf`,
      expect.any(File),
      expect.objectContaining({
        access: 'private',
        addRandomSuffix: true,
        contentType: 'application/pdf'
      })
    );
  });

  it('derives payment receipt storage extensions from the validated content type', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      }
    } as never);
    putMock.mockResolvedValueOnce({
      url: 'https://store.private.blob.vercel-storage.com/job-offers/receipt.png',
      downloadUrl: 'https://store.private.blob.vercel-storage.com/job-offers/receipt.png?download=1',
      pathname: `job-offers/${offerId}/payments/client_001/comprobante-random.png`,
      contentType: 'image/png',
      contentDisposition: 'attachment; filename="comprobante-random.png"',
      etag: '"etag"'
    });

    const response = await POST_OFFER_PAYMENT_RECEIPT(
      createReceiptUploadRequest(new File([pngReceiptBytes], 'Comprobante.HTML', { type: 'image/png' })),
      createOfferRouteContext()
    );

    expect(response.status).toBe(200);
    expect(putMock).toHaveBeenCalledWith(
      `job-offers/${offerId}/payments/client_001/comprobante.png`,
      expect.any(File),
      expect.objectContaining({
        access: 'private',
        contentType: 'image/png'
      })
    );
  });

  it('returns 422 when receipt uploads omit the file', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      }
    } as never);

    const response = await POST_OFFER_PAYMENT_RECEIPT(createReceiptUploadRequest(), createOfferRouteContext());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Subí un comprobante de pago.'
    });
    expect(putMock).not.toHaveBeenCalled();
  });

  it('returns 503 when payment receipt storage is not configured', async () => {
    vi.stubEnv('BLOB_READ_WRITE_TOKEN', undefined);
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      }
    } as never);

    const response = await POST_OFFER_PAYMENT_RECEIPT(
      createReceiptUploadRequest(new File([pdfReceiptBytes], 'comprobante.pdf', { type: 'application/pdf' })),
      createOfferRouteContext()
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'El storage de comprobantes no está configurado.'
    });
    expect(putMock).not.toHaveBeenCalled();
  });

  it('returns 422 for unsupported payment receipt content types', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      }
    } as never);

    const response = await POST_OFFER_PAYMENT_RECEIPT(
      createReceiptUploadRequest(new File(['<svg />'], 'comprobante.svg', { type: 'image/svg+xml' })),
      createOfferRouteContext()
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Subí un comprobante en imagen o PDF.'
    });
    expect(putMock).not.toHaveBeenCalled();
  });

  it('returns 422 when payment receipt magic bytes do not match the declared content type', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      }
    } as never);

    const response = await POST_OFFER_PAYMENT_RECEIPT(
      createReceiptUploadRequest(new File([pdfReceiptBytes], 'comprobante.png', { type: 'image/png' })),
      createOfferRouteContext()
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Subí un comprobante válido en imagen o PDF.'
    });
    expect(putMock).not.toHaveBeenCalled();
  });

  it('returns 422 for payment receipts over the max size', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      }
    } as never);

    const response = await POST_OFFER_PAYMENT_RECEIPT(
      createReceiptUploadRequest(
        new File([new Uint8Array(jobPaymentReceiptMaxBytes + 1)], 'comprobante.pdf', {
          type: 'application/pdf'
        })
      ),
      createOfferRouteContext()
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'El comprobante debe pesar 8 MB o menos.'
    });
    expect(putMock).not.toHaveBeenCalled();
  });

  it('returns 503 when private payment receipt storage upload fails', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      }
    } as never);
    putMock.mockRejectedValueOnce(new Error('blob upload failed'));

    const response = await POST_OFFER_PAYMENT_RECEIPT(
      createReceiptUploadRequest(new File([pdfReceiptBytes], 'comprobante.pdf', { type: 'application/pdf' })),
      createOfferRouteContext()
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'No pudimos subir el comprobante. Probá de nuevo.'
    });
  });
});

describe('/api/job-offers/[offerId]/ready', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('marks accepted in-progress jobs ready for review for the accepted worker', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobPost: {
        updateMany
      }
    } as never);

    const response = await POST_OFFER_READY(createOfferReadyRequest(), createOfferRouteContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      jobPost: {
        id: jobPostId,
        status: 'READY_FOR_REVIEW'
      }
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: jobPostId,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      },
      data: {
        status: JobPostStatus.READY_FOR_REVIEW
      }
    });
  });

  it('maps ready service conflicts to 409 responses', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeWorkerAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.READY_FOR_REVIEW,
        acceptedOfferId: offerId
      }
    });
    const updateMany = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobPost: {
        updateMany
      }
    } as never);

    const response = await POST_OFFER_READY(createOfferReadyRequest(), createOfferRouteContext());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'El trabajo no está en progreso.'
    });
    expect(updateMany).not.toHaveBeenCalled();
  });
});

describe('/api/job-offers/[offerId]/review', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('closes ready jobs for the client owner', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.READY_FOR_REVIEW,
        acceptedOfferId: offerId
      }
    });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
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

    const response = await POST_OFFER_REVIEW(createOfferReviewRequest({ action: 'close' }), createOfferRouteContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      jobPost: {
        id: jobPostId,
        status: 'CLOSED'
      }
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: jobPostId,
        status: JobPostStatus.READY_FOR_REVIEW,
        acceptedOfferId: offerId
      },
      data: {
        status: JobPostStatus.CLOSED
      }
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('returns ready jobs to in-progress and stores needs_changes chat messages', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.READY_FOR_REVIEW,
        acceptedOfferId: offerId
      }
    });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const create = vi.fn().mockResolvedValue({
      id: 'message_003',
      offerId,
      authorId: 'client_001',
      body: 'Falta repasar una pared.',
      createdAt: new Date('2026-05-13T05:00:00.000Z')
    });
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

    const response = await POST_OFFER_REVIEW(
      createOfferReviewRequest({
        action: 'needs_changes',
        message: ' Falta repasar una pared. '
      }),
      createOfferRouteContext()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      jobPost: {
        id: jobPostId,
        status: 'IN_PROGRESS'
      }
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        offerId,
        authorId: 'client_001',
        body: 'Falta repasar una pared.'
      },
      select: expect.any(Object)
    });
  });

  it('returns 400 for malformed review JSON', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);

    const response = await POST_OFFER_REVIEW(
      new NextRequest(`http://localhost/api/job-offers/${offerId}/review`, {
        method: 'POST',
        body: '{',
        headers: {
          'content-type': 'application/json'
        }
      }),
      createOfferRouteContext()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'El cuerpo del pedido no es JSON válido.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 422 field errors for invalid review actions and valid JSON null or array bodies', async () => {
    resolveRequestAuthMock
      .mockResolvedValueOnce(activeClientAuth)
      .mockResolvedValueOnce(activeClientAuth)
      .mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.READY_FOR_REVIEW,
        acceptedOfferId: offerId
      }
    });
    const transaction = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: transaction
    } as never);

    const invalidActionResponse = await POST_OFFER_REVIEW(
      createOfferReviewRequest({ action: 'archive' }),
      createOfferRouteContext()
    );
    const nullResponse = await POST_OFFER_REVIEW(createOfferReviewRequest(null), createOfferRouteContext());
    const arrayResponse = await POST_OFFER_REVIEW(createOfferReviewRequest([]), createOfferRouteContext());

    expect(invalidActionResponse.status).toBe(422);
    await expect(invalidActionResponse.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá la revisión del trabajo.',
      fieldErrors: {
        action: ['Elegí una acción válida.']
      }
    });
    expect(nullResponse.status).toBe(422);
    await expect(nullResponse.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá la revisión del trabajo.',
      fieldErrors: {
        form: ['Elegí una acción válida.']
      }
    });
    expect(arrayResponse.status).toBe(422);
    await expect(arrayResponse.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá la revisión del trabajo.',
      fieldErrors: {
        form: ['Elegí una acción válida.']
      }
    });
    expect(transaction).not.toHaveBeenCalled();
  });

  it('maps review service conflicts to 409 responses', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });
    const transaction = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      $transaction: transaction
    } as never);

    const response = await POST_OFFER_REVIEW(createOfferReviewRequest({ action: 'close' }), createOfferRouteContext());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'El trabajo no está listo para revisar.'
    });
    expect(transaction).not.toHaveBeenCalled();
  });
});

describe('/api/job-offers/[offerId]/messages', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('lists offer messages for an offer participant', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'message_001',
        offerId,
        authorId: 'worker_001',
        body: 'Puedo ir mañana.',
        createdAt: new Date('2026-05-13T02:00:00.000Z')
      }
    ]);

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobOfferMessage: {
        findMany
      }
    } as never);

    const response = await GET_OFFER_MESSAGES(createOfferMessagesGetRequest(), createOfferRouteContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      messages: [
        {
          id: 'message_001',
          offerId,
          authorId: 'worker_001',
          body: 'Puedo ir mañana.',
          createdAt: '2026-05-13T02:00:00.000Z'
        }
      ]
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(findMany).toHaveBeenCalledWith({
      where: {
        offerId
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: expect.any(Object)
    });
  });

  it('creates offer messages for an offer participant', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const create = vi.fn().mockResolvedValue({
      id: 'message_002',
      offerId,
      authorId: 'client_001',
      body: 'Coordinemos por acá.',
      createdAt: new Date('2026-05-13T02:05:00.000Z')
    });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobOfferMessage: {
        create
      }
    } as never);

    const response = await POST_OFFER_MESSAGE(
      createOfferMessageRequest({
        body: ' Coordinemos por acá. '
      }),
      createOfferRouteContext()
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message: {
        id: 'message_002',
        offerId,
        authorId: 'client_001',
        body: 'Coordinemos por acá.',
        createdAt: '2026-05-13T02:05:00.000Z'
      }
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(create).toHaveBeenCalledWith({
      data: {
        offerId,
        authorId: 'client_001',
        body: 'Coordinemos por acá.'
      },
      select: expect.any(Object)
    });
  });

  it('returns 400 for malformed message JSON', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);

    const response = await POST_OFFER_MESSAGE(
      new NextRequest(`http://localhost/api/job-offers/${offerId}/messages`, {
        method: 'POST',
        body: '{',
        headers: {
          'content-type': 'application/json'
        }
      }),
      createOfferRouteContext()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'El cuerpo del pedido no es JSON válido.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 422 field errors for invalid message bodies', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const create = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobOfferMessage: {
        create
      }
    } as never);

    const response = await POST_OFFER_MESSAGE(createOfferMessageRequest(null), createOfferRouteContext());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Revisá el mensaje.',
      fieldErrors: {}
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 409 without creating messages for rejected offers', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.REJECTED
    });
    const create = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobOfferMessage: {
        create
      }
    } as never);

    const response = await POST_OFFER_MESSAGE(createOfferMessageRequest({ body: '¿Seguimos?' }), createOfferRouteContext());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Esta oferta ya no acepta mensajes.'
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('returns 409 without creating messages for closed accepted jobs', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        ...pendingOffer.jobPost,
        status: JobPostStatus.CLOSED,
        acceptedOfferId: offerId
      }
    });
    const create = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobOfferMessage: {
        create
      }
    } as never);

    const response = await POST_OFFER_MESSAGE(createOfferMessageRequest({ body: '¿Seguimos?' }), createOfferRouteContext());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Esta oferta ya no acepta mensajes.'
    });
    expect(create).not.toHaveBeenCalled();
  });

  it('maps unrelated users to 403', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(unrelatedWorkerAuth);
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const findMany = vi.fn();

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique
      },
      jobOfferMessage: {
        findMany
      }
    } as never);

    const response = await GET_OFFER_MESSAGES(createOfferMessagesGetRequest(), createOfferRouteContext());

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'No tenés permiso para ver esta oferta.'
    });
    expect(findMany).not.toHaveBeenCalled();
  });
});

describe('/api/job-offers/[offerId]', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('accepts pending offers for the client owner', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValueOnce(pendingOffer).mockResolvedValueOnce({
      ...pendingOffer,
      status: JobOfferStatus.ACCEPTED
    });
    const offerUpdateMany = vi.fn().mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 1 });
    const jobPostUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    const transaction = vi.fn(async (callback) =>
      callback({
        jobOffer: {
          updateMany: offerUpdateMany,
          findUnique
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

    const response = await PATCH(createOfferActionRequest({ action: 'accept' }), createOfferRouteContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      offer: {
        id: offerId,
        jobPostId,
        workerId: 'worker_001',
        amountCents: 980000,
        status: 'ACCEPTED'
      }
    });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(jobPostUpdateMany).toHaveBeenCalledWith({
      where: {
        id: jobPostId,
        clientId: 'client_001',
        status: JobPostStatus.PUBLISHED,
        acceptedOfferId: null
      },
      data: {
        status: JobPostStatus.IN_PROGRESS,
        acceptedOfferId: offerId
      }
    });
  });

  it('rejects pending offers for the client owner', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique,
        updateMany
      }
    } as never);

    const response = await PATCH(createOfferActionRequest({ action: 'reject' }), createOfferRouteContext());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      offer: {
        id: offerId,
        jobPostId,
        workerId: 'worker_001',
        amountCents: 980000,
        status: 'REJECTED'
      }
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: offerId,
        status: JobOfferStatus.PENDING
      },
      data: {
        status: JobOfferStatus.REJECTED
      }
    });
  });

  it('returns 400 for malformed JSON', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);

    const response = await PATCH(
      new NextRequest(`http://localhost/api/job-offers/${offerId}`, {
        method: 'PATCH',
        body: '{',
        headers: {
          'content-type': 'application/json'
        }
      }),
      createOfferRouteContext()
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'El cuerpo del pedido no es JSON válido.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 422 for invalid actions', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);

    const response = await PATCH(createOfferActionRequest({ action: 'archive' }), createOfferRouteContext());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Elegí una acción válida para la oferta.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('returns 422 for valid JSON null bodies', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);

    const response = await PATCH(createOfferActionRequest(null), createOfferRouteContext());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Elegí una acción válida para la oferta.'
    });
    expect(getPrismaClientMock).not.toHaveBeenCalled();
  });

  it('maps service conflicts to 409 responses', async () => {
    resolveRequestAuthMock.mockResolvedValueOnce(activeClientAuth);
    const findUnique = vi.fn().mockResolvedValue(pendingOffer);
    const updateMany = vi.fn().mockResolvedValue({ count: 0 });

    getPrismaClientMock.mockReturnValue({
      jobOffer: {
        findUnique,
        updateMany
      }
    } as never);

    const response = await PATCH(createOfferActionRequest({ action: 'reject' }), createOfferRouteContext());

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: 'Esta oferta ya no se puede rechazar.'
    });
  });
});
