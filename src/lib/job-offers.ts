import { JobOfferStatus, JobPostStatus, type Prisma } from '@prisma/client';
import { z } from 'zod';

import { isJobPaymentReceiptPathForUser } from '@/lib/job-payment-receipts';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { hasRole } from '@/lib/permissions';
import { getPrismaClient } from '@/lib/prisma';
import type { RequestAuthState } from '@/lib/request-auth';

const maxAmountPesos = 21_474_836;

const offerMessages = {
  amountInvalid: 'Ingresá un monto válido.',
  amountInteger: 'Ingresá un monto entero.',
  amountPositive: 'Ingresá un monto mayor a 0.',
  amountMax: 'El monto es demasiado alto.',
  messageMax: 'Usá 800 caracteres o menos.',
  bodyRequired: 'Escribí un mensaje.',
  bodyMax: 'Usá 1200 caracteres o menos.',
  descriptionRequired: 'Agregá una descripción.',
  descriptionMax: 'Usá 240 caracteres o menos.',
  paidAtInvalid: 'Elegí una fecha válida.',
  jobPostInvalid: 'Elegí un trabajo válido.'
} as const;

const amountPesosSchema = z.coerce
  .number({ invalid_type_error: offerMessages.amountInvalid })
  .int(offerMessages.amountInteger)
  .positive(offerMessages.amountPositive)
  .max(maxAmountPesos, offerMessages.amountMax);

export const createJobOfferSchema = z.object({
  jobPostId: z.string().uuid(offerMessages.jobPostInvalid),
  amountPesos: amountPesosSchema,
  message: z.string().trim().max(800, offerMessages.messageMax).optional()
});

export const createOfferMessageSchema = z.object({
  body: z.string().trim().min(1, offerMessages.bodyRequired).max(1200, offerMessages.bodyMax)
});

export const createJobPaymentSchema = z.object({
  amountPesos: amountPesosSchema,
  paidAt: z.string().datetime(offerMessages.paidAtInvalid),
  description: z
    .string()
    .trim()
    .min(2, offerMessages.descriptionRequired)
    .max(240, offerMessages.descriptionMax),
  receiptPathname: z.string().trim().nullable().optional()
});

const reviewReadyJobOfferSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('close')
  }),
  z.object({
    action: z.literal('needs_changes'),
    message: z.string().trim().min(1, offerMessages.bodyRequired).max(1200, offerMessages.bodyMax)
  })
]);

const validReviewReadyJobOfferActions = new Set(['close', 'needs_changes']);

export type CreateJobOfferInput = z.infer<typeof createJobOfferSchema>;
export type CreateOfferMessageInput = z.infer<typeof createOfferMessageSchema>;
export type CreateJobPaymentInput = z.infer<typeof createJobPaymentSchema>;
export type ReviewReadyJobOfferInput = z.infer<typeof reviewReadyJobOfferSchema>;

type FieldErrors = Partial<Record<string, string[]>>;

type PermissionFailure = {
  ok: false;
  status: 401 | 403;
  message: string;
};

type ReadyAuth =
  | {
      ok: true;
      userId: string;
    }
  | PermissionFailure;

type ServiceFailure =
  | PermissionFailure
  | {
      ok: false;
      status: 404 | 409;
      message: string;
    }
  | {
      ok: false;
      status: 422;
      message: string;
      fieldErrors: FieldErrors;
    };

export type JobOfferSummary = {
  id: string;
  jobPostId: string;
  workerId: string;
  amountCents: number;
  status: JobOfferStatus;
};

export type JobOfferMessageSummary = {
  id: string;
  offerId: string;
  authorId: string;
  body: string;
  createdAt: Date;
};

export type JobPaymentSummary = {
  id: string;
  offerId: string;
  createdById: string;
  amountCents: number;
  paidAt: Date;
  description: string;
  receiptPathname: string | null;
  createdAt: Date;
};

export type WorkerJobPostDetail = {
  id: string;
  clientId: string;
  title: string;
  category: string;
  description: string;
  addressText: string;
  desiredTime: Date | null;
  photoPathnames: string[];
  status: JobPostStatus;
  createdAt: Date;
  acceptedOffer: (JobOfferSummary & {
    messages: JobOfferMessageSummary[];
    payments: JobPaymentSummary[];
  }) | null;
};

export type ClientJobOfferListItem = JobOfferSummary & {
  createdAt: Date;
  updatedAt: Date;
  messages: JobOfferMessageSummary[];
  payments: JobPaymentSummary[];
  worker: {
    id: string;
    email: string;
    displayName: string | null;
    profile: {
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      workerCategories: string[];
    } | null;
  };
  _count: {
    messages: number;
    payments: number;
  };
};

type OfferWithJobPost = JobOfferSummary & {
  jobPost: {
    id: string;
    clientId: string;
    status: JobPostStatus;
    acceptedOfferId?: string | null;
  };
};

class StateConflictError extends Error {}

const jobPostSelect = {
  id: true,
  clientId: true,
  title: true,
  category: true,
  description: true,
  addressText: true,
  desiredTime: true,
  photoPathnames: true,
  status: true,
  createdAt: true
} as const;

const offerSummarySelect = {
  id: true,
  jobPostId: true,
  workerId: true,
  amountCents: true,
  status: true
} as const;

const offerAccessSelect = {
  ...offerSummarySelect,
  jobPost: {
    select: {
      id: true,
      clientId: true,
      status: true,
      acceptedOfferId: true
    }
  }
} as const;

const offerMessageSelect = {
  id: true,
  offerId: true,
  authorId: true,
  body: true,
  createdAt: true
} as const;

const jobPaymentSelect = {
  id: true,
  offerId: true,
  createdById: true,
  amountCents: true,
  paidAt: true,
  description: true,
  receiptPathname: true,
  createdAt: true
} as const;

function mapZodFieldErrors(error: z.ZodError): FieldErrors {
  const fieldErrors: FieldErrors = {};

  for (const [field, messagesForField] of Object.entries(error.flatten().fieldErrors)) {
    if (messagesForField?.length) {
      fieldErrors[field] = messagesForField;
    }
  }

  return fieldErrors;
}

function isPlainInputObject(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}

function pesosToCents(amountPesos: number): number {
  return amountPesos * 100;
}

function isStateConflictError(error: unknown): error is StateConflictError {
  return error instanceof StateConflictError;
}

function mapOfferSummary(offer: JobOfferSummary): JobOfferSummary {
  return {
    id: offer.id,
    jobPostId: offer.jobPostId,
    workerId: offer.workerId,
    amountCents: offer.amountCents,
    status: offer.status
  };
}

function validatePaymentReadyOffer(offer: OfferWithJobPost): ServiceFailure | null {
  if (offer.status !== JobOfferStatus.ACCEPTED || offer.jobPost.acceptedOfferId !== offer.id) {
    return {
      ok: false,
      status: 409,
      message: 'Solo se pueden registrar pagos en ofertas aceptadas.'
    };
  }

  if (offer.jobPost.status !== JobPostStatus.IN_PROGRESS && offer.jobPost.status !== JobPostStatus.READY_FOR_REVIEW) {
    return {
      ok: false,
      status: 409,
      message: 'El trabajo no está listo para registrar pagos.'
    };
  }

  return null;
}

function validateOfferMessageWritable(offer: OfferWithJobPost): ServiceFailure | null {
  const isPendingPublished =
    offer.status === JobOfferStatus.PENDING && offer.jobPost.status === JobPostStatus.PUBLISHED;
  const isAcceptedActive =
    offer.status === JobOfferStatus.ACCEPTED &&
    (offer.jobPost.status === JobPostStatus.IN_PROGRESS || offer.jobPost.status === JobPostStatus.READY_FOR_REVIEW);

  if (isPendingPublished || isAcceptedActive) {
    return null;
  }

  return {
    ok: false,
    status: 409,
    message: 'Esta oferta ya no acepta mensajes.'
  };
}

function getActiveLinkedAuth(auth: RequestAuthState, message: string): ReadyAuth {
  if (!auth.authenticated) {
    return {
      ok: false,
      status: 401,
      message
    };
  }

  if (!auth.appUser || !auth.permissionContext) {
    return {
      ok: false,
      status: 403,
      message: 'No pudimos encontrar tu usuario de Yavaa.'
    };
  }

  if (auth.permissionContext.status !== 'ACTIVE') {
    return {
      ok: false,
      status: 403,
      message: 'Tu cuenta no está activa.'
    };
  }

  return {
    ok: true,
    userId: auth.appUser.id
  };
}

export function getReadyWorkerOfferAuth(auth: RequestAuthState): ReadyAuth {
  const activeAuth = getActiveLinkedAuth(auth, 'Iniciá sesión para ofertar.');

  if (!activeAuth.ok) {
    return activeAuth;
  }

  if (!auth.permissionContext || !hasRole(auth.permissionContext, 'trabajador')) {
    return {
      ok: false,
      status: 403,
      message: 'No tenés permiso para ofertar.'
    };
  }

  if (!hasCompletedOnboarding(auth.appUser?.profile ?? null, 'trabajador')) {
    return {
      ok: false,
      status: 403,
      message: 'Completá tu perfil de trabajador para ofertar.'
    };
  }

  return activeAuth;
}

export function getReadyClientOfferAuth(auth: RequestAuthState): ReadyAuth {
  const activeAuth = getActiveLinkedAuth(auth, 'Iniciá sesión para administrar ofertas.');

  if (!activeAuth.ok) {
    return activeAuth;
  }

  if (!auth.permissionContext || !hasRole(auth.permissionContext, 'jefe')) {
    return {
      ok: false,
      status: 403,
      message: 'No tenés permiso para administrar ofertas.'
    };
  }

  if (!hasCompletedOnboarding(auth.appUser?.profile ?? null, 'jefe')) {
    return {
      ok: false,
      status: 403,
      message: 'Completá tu perfil de cliente para administrar ofertas.'
    };
  }

  return activeAuth;
}

async function getOfferWithJobPost(offerId: string): Promise<OfferWithJobPost | null> {
  return getPrismaClient().jobOffer.findUnique({
    where: {
      id: offerId
    },
    select: offerAccessSelect
  });
}

async function getOfferAccess(
  auth: RequestAuthState,
  offerId: string
): Promise<
  | {
      ok: true;
      userId: string;
      offer: OfferWithJobPost;
      party: 'client' | 'worker';
    }
  | ServiceFailure
> {
  const activeAuth = getActiveLinkedAuth(auth, 'Iniciá sesión para ver esta oferta.');

  if (!activeAuth.ok) {
    return activeAuth;
  }

  const offer = await getOfferWithJobPost(offerId);

  if (!offer) {
    return {
      ok: false,
      status: 404,
      message: 'No encontramos esa oferta.'
    };
  }

  if (offer.jobPost.clientId === activeAuth.userId) {
    const readyAuth = getReadyClientOfferAuth(auth);

    if (!readyAuth.ok) {
      return readyAuth;
    }

    return {
      ok: true,
      userId: readyAuth.userId,
      offer,
      party: 'client'
    };
  }

  if (offer.workerId === activeAuth.userId) {
    const readyAuth = getReadyWorkerOfferAuth(auth);

    if (!readyAuth.ok) {
      return readyAuth;
    }

    return {
      ok: true,
      userId: readyAuth.userId,
      offer,
      party: 'worker'
    };
  }

  return {
    ok: false,
    status: 403,
    message: 'No tenés permiso para ver esta oferta.'
  };
}

async function getClientOwnedOffer(
  auth: RequestAuthState,
  offerId: string
): Promise<
  | {
      ok: true;
      userId: string;
      offer: OfferWithJobPost;
    }
  | ServiceFailure
> {
  const readyAuth = getReadyClientOfferAuth(auth);

  if (!readyAuth.ok) {
    return readyAuth;
  }

  const offer = await getOfferWithJobPost(offerId);

  if (!offer) {
    return {
      ok: false,
      status: 404,
      message: 'No encontramos esa oferta.'
    };
  }

  if (offer.jobPost.clientId !== readyAuth.userId) {
    return {
      ok: false,
      status: 403,
      message: 'No tenés permiso para administrar esta oferta.'
    };
  }

  return {
    ok: true,
    userId: readyAuth.userId,
    offer
  };
}

export async function authorizeJobPaymentAccess(
  auth: RequestAuthState,
  offerId: string
): Promise<
  | {
      ok: true;
      status: 200;
      userId: string;
    }
  | ServiceFailure
> {
  const access = await getOfferAccess(auth, offerId);

  if (!access.ok) {
    return access;
  }

  const paymentStateFailure = validatePaymentReadyOffer(access.offer);

  if (paymentStateFailure) {
    return paymentStateFailure;
  }

  return {
    ok: true,
    status: 200,
    userId: access.userId
  };
}

export async function getPublishedJobPostForWorker(jobPostId: string) {
  return getPrismaClient().jobPost.findFirst({
    where: {
      id: jobPostId,
      status: JobPostStatus.PUBLISHED
    },
    select: jobPostSelect
  });
}

export async function getWorkerJobPostForDetail(workerId: string, jobPostId: string): Promise<WorkerJobPostDetail | null> {
  return getPrismaClient().jobPost.findFirst({
    where: {
      id: jobPostId,
      OR: [
        {
          status: JobPostStatus.PUBLISHED
        },
        {
          status: {
            in: [JobPostStatus.IN_PROGRESS, JobPostStatus.READY_FOR_REVIEW, JobPostStatus.CLOSED]
          },
          acceptedOffer: {
            is: {
              workerId,
              status: JobOfferStatus.ACCEPTED
            }
          }
        }
      ]
    },
    select: {
      ...jobPostSelect,
      acceptedOffer: {
        select: {
          ...offerSummarySelect,
          messages: {
            orderBy: {
              createdAt: 'asc'
            },
            select: offerMessageSelect,
            take: 25
          },
          payments: {
            orderBy: {
              paidAt: 'desc'
            },
            select: jobPaymentSelect
          }
        }
      }
    }
  });
}

export async function createJobOffer(
  auth: RequestAuthState,
  input: unknown
): Promise<
  | {
      ok: true;
      status: 200;
      offer: JobOfferSummary;
    }
  | ServiceFailure
> {
  const readyAuth = getReadyWorkerOfferAuth(auth);

  if (!readyAuth.ok) {
    return readyAuth;
  }

  const validation = createJobOfferSchema.safeParse(input);

  if (!validation.success) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos de la oferta.',
      fieldErrors: mapZodFieldErrors(validation.error)
    };
  }

  const data = validation.data;
  const offer = await getPrismaClient().$transaction(async (tx: Prisma.TransactionClient) => {
    const lockedJobRows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM job_posts
      WHERE id = ${data.jobPostId}::uuid
        AND status = 'PUBLISHED'::"JobPostStatus"
      FOR UPDATE
    `;

    if (lockedJobRows.length === 0) {
      return null;
    }

    const savedOffer = await tx.jobOffer.upsert({
      where: {
        jobPostId_workerId: {
          jobPostId: data.jobPostId,
          workerId: readyAuth.userId
        }
      },
      create: {
        jobPostId: data.jobPostId,
        workerId: readyAuth.userId,
        amountCents: pesosToCents(data.amountPesos),
        status: JobOfferStatus.PENDING
      },
      update: {
        amountCents: pesosToCents(data.amountPesos),
        status: JobOfferStatus.PENDING
      },
      select: offerSummarySelect
    });

    if (data.message) {
      await tx.jobOfferMessage.create({
        data: {
          offerId: savedOffer.id,
          authorId: readyAuth.userId,
          body: data.message
        },
        select: offerMessageSelect
      });
    }

    return savedOffer;
  });

  if (!offer) {
    return {
      ok: false,
      status: 404,
      message: 'No encontramos ese trabajo publicado.'
    };
  }

  return {
    ok: true,
    status: 200,
    offer: mapOfferSummary(offer)
  };
}

export async function acceptJobOffer(
  auth: RequestAuthState,
  offerId: string
): Promise<
  | {
      ok: true;
      status: 200;
      offer: JobOfferSummary;
    }
  | ServiceFailure
> {
  const access = await getClientOwnedOffer(auth, offerId);

  if (!access.ok) {
    return access;
  }

  try {
    const offer = await getPrismaClient().$transaction(async (tx: Prisma.TransactionClient) => {
      const jobPostUpdate = await tx.jobPost.updateMany({
        where: {
          id: access.offer.jobPostId,
          clientId: access.userId,
          status: JobPostStatus.PUBLISHED,
          acceptedOfferId: null
        },
        data: {
          status: JobPostStatus.IN_PROGRESS,
          acceptedOfferId: offerId
        }
      });

      if (jobPostUpdate.count === 0) {
        throw new StateConflictError();
      }

      const selectedOfferUpdate = await tx.jobOffer.updateMany({
        where: {
          id: offerId,
          jobPostId: access.offer.jobPostId,
          status: JobOfferStatus.PENDING
        },
        data: {
          status: JobOfferStatus.ACCEPTED
        }
      });

      if (selectedOfferUpdate.count === 0) {
        throw new StateConflictError();
      }

      await tx.jobOffer.updateMany({
        where: {
          jobPostId: access.offer.jobPostId,
          id: {
            not: offerId
          },
          status: JobOfferStatus.PENDING
        },
        data: {
          status: JobOfferStatus.REJECTED
        }
      });

      const acceptedOffer = await tx.jobOffer.findUnique({
        where: {
          id: offerId
        },
        select: offerSummarySelect
      });

      if (!acceptedOffer) {
        throw new StateConflictError();
      }

      return acceptedOffer;
    });

    return {
      ok: true,
      status: 200,
      offer: mapOfferSummary(offer)
    };
  } catch (error) {
    if (!isStateConflictError(error)) {
      throw error;
    }

    return {
      ok: false,
      status: 409,
      message: 'Esta oferta ya no se puede aceptar.'
    };
  }
}

export async function rejectJobOffer(
  auth: RequestAuthState,
  offerId: string
): Promise<
  | {
      ok: true;
      status: 200;
      offer: JobOfferSummary;
    }
  | ServiceFailure
> {
  const access = await getClientOwnedOffer(auth, offerId);

  if (!access.ok) {
    return access;
  }

  const updateResult = await getPrismaClient().jobOffer.updateMany({
    where: {
      id: offerId,
      status: JobOfferStatus.PENDING
    },
    data: {
      status: JobOfferStatus.REJECTED
    }
  });

  if (updateResult.count === 0) {
    return {
      ok: false,
      status: 409,
      message: 'Esta oferta ya no se puede rechazar.'
    };
  }

  return {
    ok: true,
    status: 200,
    offer: mapOfferSummary({
      ...access.offer,
      status: JobOfferStatus.REJECTED
    })
  };
}

export async function addOfferMessage(
  auth: RequestAuthState,
  offerId: string,
  input: unknown
): Promise<
  | {
      ok: true;
      status: 200;
      message: JobOfferMessageSummary;
    }
  | ServiceFailure
> {
  const access = await getOfferAccess(auth, offerId);

  if (!access.ok) {
    return access;
  }

  const messageStateFailure = validateOfferMessageWritable(access.offer);

  if (messageStateFailure) {
    return messageStateFailure;
  }

  const validation = createOfferMessageSchema.safeParse(input);

  if (!validation.success) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá el mensaje.',
      fieldErrors: mapZodFieldErrors(validation.error)
    };
  }

  const message = await getPrismaClient().jobOfferMessage.create({
    data: {
      offerId,
      authorId: access.userId,
      body: validation.data.body
    },
    select: offerMessageSelect
  });

  return {
    ok: true,
    status: 200,
    message
  };
}

export async function listOfferMessages(
  auth: RequestAuthState,
  offerId: string
): Promise<
  | {
      ok: true;
      status: 200;
      messages: JobOfferMessageSummary[];
    }
  | ServiceFailure
> {
  const access = await getOfferAccess(auth, offerId);

  if (!access.ok) {
    return access;
  }

  const messages = await getPrismaClient().jobOfferMessage.findMany({
    where: {
      offerId
    },
    orderBy: {
      createdAt: 'asc'
    },
    select: offerMessageSelect
  });

  return {
    ok: true,
    status: 200,
    messages
  };
}

export async function createJobPayment(
  auth: RequestAuthState,
  offerId: string,
  input: unknown
): Promise<
  | {
      ok: true;
      status: 200;
      payment: JobPaymentSummary;
    }
  | ServiceFailure
> {
  const access = await getOfferAccess(auth, offerId);

  if (!access.ok) {
    return access;
  }

  const paymentStateFailure = validatePaymentReadyOffer(access.offer);

  if (paymentStateFailure) {
    return paymentStateFailure;
  }

  if (!isPlainInputObject(input)) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del pago.',
      fieldErrors: {
        form: ['Completá los datos del pago.']
      }
    };
  }

  const validation = createJobPaymentSchema.safeParse(input);

  if (!validation.success) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del pago.',
      fieldErrors: mapZodFieldErrors(validation.error)
    };
  }

  const data = validation.data;

  if (data.receiptPathname && !isJobPaymentReceiptPathForUser(data.receiptPathname, offerId, access.userId)) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del pago.',
      fieldErrors: {
        receiptPathname: ['Subí un comprobante válido.']
      }
    };
  }

  const payment = await getPrismaClient().$transaction(async (tx: Prisma.TransactionClient) => {
    const lockedPayableJobRows = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT jp.id
      FROM job_posts jp
      INNER JOIN job_offers jo ON jo.job_post_id = jp.id
      WHERE jo.id = ${offerId}::uuid
        AND jo.status = 'ACCEPTED'::"job_offer_status"
        AND jp.accepted_offer_id = ${offerId}::uuid
        AND jp.status IN ('IN_PROGRESS'::"JobPostStatus", 'READY_FOR_REVIEW'::"JobPostStatus")
      FOR UPDATE OF jp
    `;

    if (lockedPayableJobRows.length === 0) {
      return null;
    }

    return tx.jobPayment.create({
      data: {
        offerId,
        createdById: access.userId,
        amountCents: pesosToCents(data.amountPesos),
        paidAt: new Date(data.paidAt),
        description: data.description,
        receiptPathname: data.receiptPathname ?? null
      },
      select: jobPaymentSelect
    });
  });

  if (!payment) {
    return {
      ok: false,
      status: 409,
      message: 'El trabajo no está listo para registrar pagos.'
    };
  }

  return {
    ok: true,
    status: 200,
    payment
  };
}

export async function listJobPayments(
  auth: RequestAuthState,
  offerId: string
): Promise<
  | {
      ok: true;
      status: 200;
      payments: JobPaymentSummary[];
    }
  | ServiceFailure
> {
  const access = await getOfferAccess(auth, offerId);

  if (!access.ok) {
    return access;
  }

  const paymentStateFailure = validatePaymentReadyOffer(access.offer);

  if (paymentStateFailure) {
    return paymentStateFailure;
  }

  const payments = await getPrismaClient().jobPayment.findMany({
    where: {
      offerId
    },
    orderBy: {
      paidAt: 'asc'
    },
    select: jobPaymentSelect
  });

  return {
    ok: true,
    status: 200,
    payments
  };
}

export async function markJobOfferReady(
  auth: RequestAuthState,
  offerId: string
): Promise<
  | {
      ok: true;
      status: 200;
      jobPost: {
        id: string;
        status: JobPostStatus;
      };
    }
  | ServiceFailure
> {
  const access = await getOfferAccess(auth, offerId);

  if (!access.ok) {
    return access;
  }

  if (access.party !== 'worker') {
    return {
      ok: false,
      status: 403,
      message: 'Solo el trabajador aceptado puede marcar el trabajo como listo.'
    };
  }

  if (access.offer.status !== JobOfferStatus.ACCEPTED || access.offer.jobPost.acceptedOfferId !== offerId) {
    return {
      ok: false,
      status: 409,
      message: 'Esta oferta no está aceptada.'
    };
  }

  if (access.offer.jobPost.status !== JobPostStatus.IN_PROGRESS) {
    return {
      ok: false,
      status: 409,
      message: 'El trabajo no está en progreso.'
    };
  }

  const updateResult = await getPrismaClient().jobPost.updateMany({
    where: {
      id: access.offer.jobPostId,
      status: JobPostStatus.IN_PROGRESS,
      acceptedOfferId: offerId
    },
    data: {
      status: JobPostStatus.READY_FOR_REVIEW
    }
  });

  if (updateResult.count === 0) {
    return {
      ok: false,
      status: 409,
      message: 'El trabajo no está en progreso.'
    };
  }

  return {
    ok: true,
    status: 200,
    jobPost: {
      id: access.offer.jobPostId,
      status: JobPostStatus.READY_FOR_REVIEW
    }
  };
}

export async function reviewReadyJobOffer(
  auth: RequestAuthState,
  offerId: string,
  input: unknown
): Promise<
  | {
      ok: true;
      status: 200;
      jobPost: {
        id: string;
        status: JobPostStatus;
      };
    }
  | ServiceFailure
> {
  const access = await getClientOwnedOffer(auth, offerId);

  if (!access.ok) {
    return access;
  }

  if (access.offer.status !== JobOfferStatus.ACCEPTED || access.offer.jobPost.acceptedOfferId !== offerId) {
    return {
      ok: false,
      status: 409,
      message: 'Esta oferta no está aceptada.'
    };
  }

  if (access.offer.jobPost.status !== JobPostStatus.READY_FOR_REVIEW) {
    return {
      ok: false,
      status: 409,
      message: 'El trabajo no está listo para revisar.'
    };
  }

  if (!isPlainInputObject(input)) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá la revisión del trabajo.',
      fieldErrors: {
        form: ['Elegí una acción válida.']
      }
    };
  }

  if (typeof input.action !== 'string' || !validReviewReadyJobOfferActions.has(input.action)) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá la revisión del trabajo.',
      fieldErrors: {
        action: ['Elegí una acción válida.']
      }
    };
  }

  const validation = reviewReadyJobOfferSchema.safeParse(input);

  if (!validation.success) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá la revisión del trabajo.',
      fieldErrors: mapZodFieldErrors(validation.error)
    };
  }

  try {
    await getPrismaClient().$transaction(async (tx: Prisma.TransactionClient) => {
      const jobPostUpdate = await tx.jobPost.updateMany({
        where: {
          id: access.offer.jobPostId,
          status: JobPostStatus.READY_FOR_REVIEW,
          acceptedOfferId: offerId
        },
        data: {
          status:
            validation.data.action === 'close'
              ? JobPostStatus.CLOSED
              : JobPostStatus.IN_PROGRESS
        }
      });

      if (jobPostUpdate.count === 0) {
        throw new StateConflictError();
      }

      if (validation.data.action === 'needs_changes') {
        await tx.jobOfferMessage.create({
          data: {
            offerId,
            authorId: access.userId,
            body: validation.data.message
          },
          select: offerMessageSelect
        });
      }
    });
  } catch (error) {
    if (!isStateConflictError(error)) {
      throw error;
    }

    return {
      ok: false,
      status: 409,
      message: 'El trabajo no está listo para revisar.'
    };
  }

  return {
    ok: true,
    status: 200,
    jobPost: {
      id: access.offer.jobPostId,
      status:
        validation.data.action === 'close'
          ? JobPostStatus.CLOSED
          : JobPostStatus.IN_PROGRESS
    }
  };
}

export async function listClientJobOffers(clientId: string, jobPostId: string): Promise<ClientJobOfferListItem[]> {
  const jobPost = await getPrismaClient().jobPost.findFirst({
    where: {
      id: jobPostId,
      clientId
    },
    select: {
      id: true
    }
  });

  if (!jobPost) {
    return [];
  }

  const offers = await getPrismaClient().jobOffer.findMany({
    where: {
      jobPostId
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      ...offerSummarySelect,
      createdAt: true,
      updatedAt: true,
      worker: {
        select: {
          id: true,
          email: true,
          displayName: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
              workerCategories: true
            }
          }
        }
      },
      _count: {
        select: {
          messages: true,
          payments: true
        }
      },
      messages: {
        orderBy: {
          createdAt: 'desc'
        },
        select: offerMessageSelect,
        take: 25
      },
      payments: {
        orderBy: {
          paidAt: 'asc'
        },
        select: jobPaymentSelect,
        take: 25
      }
    }
  });

  return offers.map((offer) => ({
    ...offer,
    messages: [...offer.messages].reverse()
  }));
}
