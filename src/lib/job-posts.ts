import { JobPostStatus } from '@prisma/client';
import { z } from 'zod';

import { isJobPhotoBlobPath, isJobPhotoBlobPathForUser, maxJobPhotos } from '@/lib/job-photos';
import { hasCompletedOnboarding } from '@/lib/onboarding';
import { hasRole } from '@/lib/permissions';
import { getPrismaClient } from '@/lib/prisma';
import type { RequestAuthState } from '@/lib/request-auth';

const messages = {
  titleRequired: 'Usá un título de al menos 3 caracteres.',
  titleMax: 'Usá 80 caracteres o menos.',
  categoryRequired: 'Elegí una categoría.',
  categoryMax: 'Usá 40 caracteres o menos.',
  descriptionRequired: 'Contá un poco más del trabajo.',
  descriptionMax: 'Usá 800 caracteres o menos.',
  addressRequired: 'Ingresá una ubicación válida.',
  addressMax: 'Usá 160 caracteres o menos.',
  desiredTimeInvalid: 'Elegí una fecha válida.',
  photoInvalid: 'Usá fotos subidas desde este trabajo.',
  photoMax: `Usá ${maxJobPhotos} fotos o menos.`
} as const;

export const createJobPostSchema = z.object({
  title: z
    .string({
      required_error: messages.titleRequired,
      invalid_type_error: messages.titleRequired
    })
    .trim()
    .min(3, messages.titleRequired)
    .max(80, messages.titleMax),
  category: z
    .string({
      required_error: messages.categoryRequired,
      invalid_type_error: messages.categoryRequired
    })
    .trim()
    .min(2, messages.categoryRequired)
    .max(40, messages.categoryMax),
  description: z
    .string({
      required_error: messages.descriptionRequired,
      invalid_type_error: messages.descriptionRequired
    })
    .trim()
    .min(10, messages.descriptionRequired)
    .max(800, messages.descriptionMax),
  addressText: z
    .string({
      required_error: messages.addressRequired,
      invalid_type_error: messages.addressRequired
    })
    .trim()
    .min(3, messages.addressRequired)
    .max(160, messages.addressMax),
  desiredTime: z.string().datetime(messages.desiredTimeInvalid).optional(),
  photoPathnames: z
    .array(z.string().refine((value) => isJobPhotoBlobPath(value), messages.photoInvalid))
    .max(maxJobPhotos, messages.photoMax)
    .optional()
});

export type CreateJobPostInput = z.infer<typeof createJobPostSchema>;
export type JobPostField = keyof CreateJobPostInput;
export type JobPostFieldErrors = Partial<Record<JobPostField, string[]>>;

export type JobPostSummary = {
  id: string;
  title: string;
  category: string;
  description: string;
  addressText: string;
  desiredTime: Date | null;
  photoPathnames: string[];
  status: JobPostStatus;
  createdAt: Date;
};

export type JobPostApiSummary = Omit<JobPostSummary, 'desiredTime' | 'createdAt'> & {
  desiredTime: string | null;
  createdAt: string;
};

type ReadyJefeAuth =
  | {
      ok: true;
      userId: string;
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    };

export type CreateJobPostResult =
  | {
      ok: true;
      status: 200;
      jobPost: Pick<JobPostSummary, 'id' | 'title' | 'category' | 'status'>;
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    }
  | {
      ok: false;
      status: 422;
      message: string;
      fieldErrors: JobPostFieldErrors;
    };

export type ListJobPostsResult =
  | {
      ok: true;
      status: 200;
      jobPosts: JobPostSummary[];
    }
  | {
      ok: false;
      status: 401 | 403;
      message: string;
    };

export type UpdateJobPostResult =
  | {
      ok: true;
      status: 200;
      jobPost: JobPostSummary;
    }
  | {
      ok: false;
      status: 401 | 403 | 404;
      message: string;
    }
  | {
      ok: false;
      status: 422;
      message: string;
      fieldErrors: JobPostFieldErrors;
    };

const jobPostSelect = {
  id: true,
  title: true,
  category: true,
  description: true,
  addressText: true,
  desiredTime: true,
  photoPathnames: true,
  status: true,
  createdAt: true
} as const;

function mapZodFieldErrors(error: z.ZodError): JobPostFieldErrors {
  const fieldErrors: JobPostFieldErrors = {};

  for (const [field, messagesForField] of Object.entries(error.flatten().fieldErrors)) {
    if (messagesForField?.length) {
      fieldErrors[field as JobPostField] = messagesForField;
    }
  }

  return fieldErrors;
}

export function serializeJobPost(jobPost: JobPostSummary): JobPostApiSummary {
  return {
    ...jobPost,
    desiredTime: jobPost.desiredTime?.toISOString() ?? null,
    createdAt: jobPost.createdAt.toISOString()
  };
}

export function getReadyJefeMarketplaceAuth(auth: RequestAuthState): ReadyJefeAuth {
  if (!auth.authenticated) {
    return {
      ok: false,
      status: 401,
      message: 'Iniciá sesión para publicar trabajos.'
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
      message: 'No tenés permiso para publicar trabajos.'
    };
  }

  if (!hasCompletedOnboarding(auth.appUser.profile, 'jefe')) {
    return {
      ok: false,
      status: 403,
      message: 'Completá tu perfil de cliente para publicar trabajos.'
    };
  }

  return {
    ok: true,
    userId: auth.appUser.id
  };
}

export async function createJobPost(auth: RequestAuthState, input: unknown): Promise<CreateJobPostResult> {
  const readyAuth = getReadyJefeMarketplaceAuth(auth);

  if (!readyAuth.ok) {
    return readyAuth;
  }

  const validation = createJobPostSchema.safeParse(input);

  if (!validation.success) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del trabajo.',
      fieldErrors: mapZodFieldErrors(validation.error)
    };
  }

  const data = validation.data;
  const photoPathnames = data.photoPathnames ?? [];

  if (photoPathnames.some((pathname) => !isJobPhotoBlobPathForUser(pathname, readyAuth.userId))) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del trabajo.',
      fieldErrors: {
        photoPathnames: [messages.photoInvalid]
      }
    };
  }

  const jobPost = await getPrismaClient().jobPost.create({
    data: {
      clientId: readyAuth.userId,
      title: data.title,
      category: data.category,
      description: data.description,
      addressText: data.addressText,
      desiredTime: data.desiredTime ? new Date(data.desiredTime) : null,
      photoPathnames
    },
    select: jobPostSelect
  });

  return {
    ok: true,
    status: 200,
    jobPost: {
      id: jobPost.id,
      title: jobPost.title,
      category: jobPost.category,
      status: jobPost.status
    }
  };
}

export async function listClientJobPosts(clientId: string, take = 10): Promise<JobPostSummary[]> {
  return getPrismaClient().jobPost.findMany({
    where: {
      clientId
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: jobPostSelect,
    take
  });
}

export async function listActiveClientJobPosts(clientId: string, take = 10): Promise<JobPostSummary[]> {
  return getPrismaClient().jobPost.findMany({
    where: {
      clientId,
      status: JobPostStatus.PUBLISHED
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: jobPostSelect,
    take
  });
}

export async function listPublishedWorkerJobPosts(workerCategories: readonly string[], take = 10): Promise<JobPostSummary[]> {
  if (workerCategories.length === 0) {
    return [];
  }

  return getPrismaClient().jobPost.findMany({
    where: {
      status: JobPostStatus.PUBLISHED,
      category: {
        in: [...workerCategories]
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    select: jobPostSelect,
    take
  });
}

export async function getActiveClientJobPost(clientId: string, jobPostId: string): Promise<JobPostSummary | null> {
  return getPrismaClient().jobPost.findFirst({
    where: {
      id: jobPostId,
      clientId,
      status: JobPostStatus.PUBLISHED
    },
    select: jobPostSelect
  });
}

export async function updateAuthenticatedClientJobPost(
  auth: RequestAuthState,
  jobPostId: string,
  input: unknown
): Promise<UpdateJobPostResult> {
  const readyAuth = getReadyJefeMarketplaceAuth(auth);

  if (!readyAuth.ok) {
    return readyAuth;
  }

  const validation = createJobPostSchema.safeParse(input);

  if (!validation.success) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del trabajo.',
      fieldErrors: mapZodFieldErrors(validation.error)
    };
  }

  const data = validation.data;
  const photoPathnames = data.photoPathnames ?? [];

  if (photoPathnames.some((pathname) => !isJobPhotoBlobPathForUser(pathname, readyAuth.userId))) {
    return {
      ok: false,
      status: 422,
      message: 'Revisá los datos del trabajo.',
      fieldErrors: {
        photoPathnames: [messages.photoInvalid]
      }
    };
  }

  const where = {
    id: jobPostId,
    clientId: readyAuth.userId,
    status: JobPostStatus.PUBLISHED
  } as const;

  const updateResult = await getPrismaClient().jobPost.updateMany({
    where,
    data: {
      title: data.title,
      category: data.category,
      description: data.description,
      addressText: data.addressText,
      desiredTime: data.desiredTime ? new Date(data.desiredTime) : null,
      ...(data.photoPathnames ? { photoPathnames } : {})
    }
  });

  if (updateResult.count === 0) {
    return {
      ok: false,
      status: 404,
      message: 'No encontramos ese trabajo activo.'
    };
  }

  const jobPost = await getActiveClientJobPost(readyAuth.userId, jobPostId);

  if (!jobPost) {
    return {
      ok: false,
      status: 404,
      message: 'No encontramos ese trabajo activo.'
    };
  }

  return {
    ok: true,
    status: 200,
    jobPost
  };
}

export async function listAuthenticatedClientJobPosts(auth: RequestAuthState): Promise<ListJobPostsResult> {
  const readyAuth = getReadyJefeMarketplaceAuth(auth);

  if (!readyAuth.ok) {
    return readyAuth;
  }

  return {
    ok: true,
    status: 200,
    jobPosts: await listClientJobPosts(readyAuth.userId)
  };
}
