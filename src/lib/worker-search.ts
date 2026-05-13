import { IdentityVerificationStatus, UserStatus } from '@prisma/client';

import { hasCompletedOnboarding } from '@/lib/onboarding';
import { hasRole } from '@/lib/permissions';
import { getPrismaClient } from '@/lib/prisma';
import type { RequestAuthState } from '@/lib/request-auth';

export type WorkerSearchParams = {
  category?: string | null;
  q?: string | null;
};

export type WorkerWorkHistoryItem = {
  id: string;
  title: string;
  completedAtLabel: string;
};

export type WorkerSearchResultItem = {
  id: string;
  displayName: string;
  categories: string[];
  bio: string | null;
  hourlyRateCents: number | null;
  identityVerificationStatus: IdentityVerificationStatus;
  distanceLabel: string;
  rating: {
    average: number | null;
    count: number;
  };
  workHistory: WorkerWorkHistoryItem[];
};

export type WorkerSearchResult =
  | {
      ok: true;
      status: 200;
      workers: WorkerSearchResultItem[];
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    };

type WorkerRecord = {
  id: string;
  email: string;
  displayName: string | null;
  profile: {
    firstName: string | null;
    lastName: string | null;
    bio: string | null;
    workerCategories: string[];
    workerHourlyRateCents: number | null;
    identityVerificationStatus: IdentityVerificationStatus;
    addressText: string | null;
  } | null;
};

const workerSearchSelect = {
  id: true,
  email: true,
  displayName: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      bio: true,
      workerCategories: true,
      workerHourlyRateCents: true,
      identityVerificationStatus: true,
      addressText: true
    }
  }
} as const;

function getReadyWorkerSearchAuth(auth: RequestAuthState):
  | {
      ok: true;
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    } {
  if (!auth.authenticated) {
    return {
      ok: false,
      status: 401,
      message: 'Iniciá sesión para buscar trabajadores.'
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

  if (!hasRole(auth.permissionContext, 'jefe')) {
    return {
      ok: false,
      status: 403,
      message: 'No tenés permiso para buscar trabajadores.'
    };
  }

  if (!hasCompletedOnboarding(auth.appUser.profile, 'jefe')) {
    return {
      ok: false,
      status: 403,
      message: 'Completá tu perfil de cliente para buscar trabajadores.'
    };
  }

  return {
    ok: true
  };
}

function normalizeParam(value?: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed ? trimmed : null;
}

function buildDisplayName(worker: WorkerRecord): string {
  const firstName = worker.profile?.firstName?.trim();
  const lastInitial = worker.profile?.lastName?.trim().charAt(0);

  if (firstName && lastInitial) {
    return `${firstName} ${lastInitial}.`;
  }

  if (firstName) {
    return firstName;
  }

  return worker.displayName || worker.email.split('@')[0] || 'Trabajador';
}

function mapWorker(worker: WorkerRecord): WorkerSearchResultItem {
  return {
    id: worker.id,
    displayName: buildDisplayName(worker),
    categories: worker.profile?.workerCategories ?? [],
    bio: worker.profile?.bio?.trim() || null,
    hourlyRateCents: worker.profile?.workerHourlyRateCents ?? null,
    identityVerificationStatus: worker.profile?.identityVerificationStatus ?? IdentityVerificationStatus.NOT_STARTED,
    distanceLabel: 'Cerca',
    rating: {
      average: null,
      count: 0
    },
    workHistory: []
  };
}

export async function searchWorkers(
  auth: RequestAuthState,
  params: WorkerSearchParams = {}
): Promise<WorkerSearchResult> {
  const readyAuth = getReadyWorkerSearchAuth(auth);

  if (!readyAuth.ok) {
    return readyAuth;
  }

  const category = normalizeParam(params.category);
  const q = normalizeParam(params.q);
  const profileFilter = {
    workerOnboardingCompletedAt: {
      not: null
    },
    workerCategories: {
      isEmpty: false,
      ...(category ? { has: category } : {})
    },
    ...(q
      ? {
          OR: [
            {
              firstName: {
                contains: q,
                mode: 'insensitive' as const
              }
            },
            {
              lastName: {
                contains: q,
                mode: 'insensitive' as const
              }
            },
            {
              addressText: {
                contains: q,
                mode: 'insensitive' as const
              }
            }
          ]
        }
      : {})
  };

  const workers = await getPrismaClient().user.findMany({
    where: {
      status: UserStatus.ACTIVE,
      roles: {
        some: {
          role: {
            slug: 'trabajador'
          }
        }
      },
      profile: {
        is: profileFilter
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    select: workerSearchSelect,
    take: 20
  });

  return {
    ok: true,
    status: 200,
    workers: workers.map((worker) => mapWorker(worker))
  };
}
