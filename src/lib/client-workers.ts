import { IdentityVerificationStatus, JobOfferStatus, JobPostStatus, UserStatus } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

const visibleAcceptedJobPostStatuses = [
  JobPostStatus.IN_PROGRESS,
  JobPostStatus.READY_FOR_REVIEW,
  JobPostStatus.CLOSED
];

type WorkerIdentityRecord = {
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

type AcceptedWorkerOfferRecord = {
  id: string;
  amountCents: number;
  updatedAt: Date;
  worker: WorkerIdentityRecord;
  jobPost: {
    id: string;
    title: string;
    status: JobPostStatus;
    updatedAt: Date;
  };
  _count: {
    messages: number;
    payments: number;
  };
};

type ClientWorkerHistoryRecord = WorkerIdentityRecord & {
  profile: (WorkerIdentityRecord['profile'] & {
    bio: string | null;
    workerHourlyRateCents: number | null;
    identityVerificationStatus: IdentityVerificationStatus;
    addressText: string | null;
  }) | null;
  jobOffers: Array<{
    id: string;
    amountCents: number;
    status: JobOfferStatus;
    createdAt: Date;
    updatedAt: Date;
    jobPost: {
      id: string;
      title: string;
      category: string;
      status: JobPostStatus;
      createdAt: Date;
    };
    _count: {
      messages: number;
      payments: number;
    };
  }>;
};

export type ClientAcceptedWorker = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  categories: string[];
  acceptedJobsCount: number;
  lastJobTitle: string;
  lastInteractionAt: Date;
  totalMessagesCount: number;
  totalPaymentsCount: number;
};

export type ClientWorkerHistoryItem = {
  offerId: string;
  jobPostId: string;
  title: string;
  category: string;
  status: JobPostStatus;
  amountCents: number;
  messagesCount: number;
  paymentsCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientWorkerHistory = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  categories: string[];
  hourlyRateCents: number | null;
  identityVerificationStatus: IdentityVerificationStatus;
  addressText: string | null;
  history: ClientWorkerHistoryItem[];
};

const acceptedWorkerOfferSelect = {
  id: true,
  amountCents: true,
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
  jobPost: {
    select: {
      id: true,
      title: true,
      status: true,
      updatedAt: true
    }
  },
  _count: {
    select: {
      messages: true,
      payments: true
    }
  }
} as const;

function buildClientWorkerHistorySelect(clientId: string) {
  return {
  id: true,
  email: true,
  displayName: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      workerCategories: true,
      workerHourlyRateCents: true,
      identityVerificationStatus: true,
      addressText: true
    }
  },
  jobOffers: {
    where: {
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        clientId,
        status: {
          in: visibleAcceptedJobPostStatuses
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    select: {
      id: true,
      amountCents: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      jobPost: {
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true
        }
      },
      _count: {
        select: {
          messages: true,
          payments: true
        }
      }
    }
  }
  } as const;
}

function buildDisplayName(worker: WorkerIdentityRecord): string {
  const firstName = worker.profile?.firstName?.trim();
  const lastInitial = worker.profile?.lastName?.trim().charAt(0);

  if (firstName && lastInitial) {
    return `${firstName} ${lastInitial.toLocaleUpperCase('es-AR')}.`;
  }

  if (firstName) {
    return firstName;
  }

  return worker.displayName?.trim() || worker.email.split('@')[0] || 'Trabajador';
}

function mapAcceptedWorker(offer: AcceptedWorkerOfferRecord): ClientAcceptedWorker {
  return {
    id: offer.worker.id,
    displayName: buildDisplayName(offer.worker),
    avatarUrl: offer.worker.profile?.avatarUrl ?? null,
    categories: offer.worker.profile?.workerCategories ?? [],
    acceptedJobsCount: 1,
    lastJobTitle: offer.jobPost.title,
    lastInteractionAt: offer.updatedAt,
    totalMessagesCount: offer._count.messages,
    totalPaymentsCount: offer._count.payments
  };
}

export async function listClientAcceptedWorkers(clientId: string, take = 40): Promise<ClientAcceptedWorker[]> {
  const offers = await getPrismaClient().jobOffer.findMany({
    where: {
      status: JobOfferStatus.ACCEPTED,
      jobPost: {
        clientId,
        status: {
          in: visibleAcceptedJobPostStatuses
        }
      },
      worker: {
        status: UserStatus.ACTIVE
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    select: acceptedWorkerOfferSelect,
    take
  });

  const workersById = new Map<string, ClientAcceptedWorker>();

  for (const offer of offers) {
    const existingWorker = workersById.get(offer.worker.id);

    if (!existingWorker) {
      workersById.set(offer.worker.id, mapAcceptedWorker(offer));
      continue;
    }

    existingWorker.acceptedJobsCount += 1;
    existingWorker.totalMessagesCount += offer._count.messages;
    existingWorker.totalPaymentsCount += offer._count.payments;
  }

  return Array.from(workersById.values());
}

export async function getClientWorkerHistory(
  clientId: string,
  workerId: string
): Promise<ClientWorkerHistory | null> {
  const worker = await getPrismaClient().user.findFirst({
    where: {
      id: workerId,
      status: UserStatus.ACTIVE,
      jobOffers: {
        some: {
          status: JobOfferStatus.ACCEPTED,
          jobPost: {
            clientId,
            status: {
              in: visibleAcceptedJobPostStatuses
            }
          }
        }
      }
    },
    select: buildClientWorkerHistorySelect(clientId)
  });

  if (!worker) {
    return null;
  }

  const record = worker as ClientWorkerHistoryRecord;

  return {
    id: record.id,
    displayName: buildDisplayName(record),
    avatarUrl: record.profile?.avatarUrl ?? null,
    bio: record.profile?.bio?.trim() || null,
    categories: record.profile?.workerCategories ?? [],
    hourlyRateCents: record.profile?.workerHourlyRateCents ?? null,
    identityVerificationStatus: record.profile?.identityVerificationStatus ?? IdentityVerificationStatus.NOT_STARTED,
    addressText: record.profile?.addressText ?? null,
    history: record.jobOffers.map((offer) => ({
      offerId: offer.id,
      jobPostId: offer.jobPost.id,
      title: offer.jobPost.title,
      category: offer.jobPost.category,
      status: offer.jobPost.status,
      amountCents: offer.amountCents,
      messagesCount: offer._count.messages,
      paymentsCount: offer._count.payments,
      createdAt: offer.jobPost.createdAt,
      updatedAt: offer.updatedAt
    }))
  };
}
