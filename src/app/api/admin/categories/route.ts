import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import {
  adminCategoryListFiltersSchema,
  adminCategorySchema,
  listCategoriesForAdmin,
  upsertCategoryForAdmin
} from '@/lib/admin-categories';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';
import { hasDatabaseEnv } from '@/lib/env';

function mapAdminCategoryError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Category payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'Only active admins can manage categories.'
        }
      };
    }

    if (error.message === 'initial-category-pause-forbidden') {
      return {
        status: 422,
        body: {
          error: 'initial-category-pause-forbidden',
          message: 'Initial categories cannot be paused.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not manage the category catalog.'
    }
  };
}

export async function GET(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'Only active admins can manage categories.'
      },
      { status: 403 }
    );
  }

  const parsedFilters = adminCategoryListFiltersSchema.safeParse({
    status: request.nextUrl.searchParams.get('status') ?? undefined
  });

  if (!parsedFilters.success) {
    return jsonResponse(
      {
        error: 'invalid-request',
        issues: parsedFilters.error.flatten()
      },
      { status: 400 }
    );
  }

  if (!hasDatabaseEnv()) {
    return jsonResponse(
      {
        categories: []
      },
      { status: 200 }
    );
  }

  const prisma = getPrismaClient();
  try {
    const categories = await listCategoriesForAdmin(prisma, auth.permissionContext, parsedFilters.data);

    return jsonResponse(
      {
        categories
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapAdminCategoryError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'Only active admins can create or edit categories.'
      },
      { status: 403 }
    );
  }

  try {
    const parsedBody = adminCategorySchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return jsonResponse(
        {
          error: 'invalid-request',
          issues: parsedBody.error.flatten()
        },
        { status: 400 }
      );
    }

    const prisma = getPrismaClient();
    const category = await upsertCategoryForAdmin(prisma, auth.permissionContext, parsedBody.data);

    return jsonResponse(
      {
        category
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapAdminCategoryError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
