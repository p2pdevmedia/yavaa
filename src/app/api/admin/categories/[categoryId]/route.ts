import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import {
  adminCategoryUpdateSchema,
  deleteCategoryForAdmin,
  updateCategoryForAdmin
} from '@/lib/admin-categories';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteParams = {
  params: Promise<{
    categoryId: string;
  }>;
};

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

    if (error.message === 'category-not-found') {
      return {
        status: 404,
        body: {
          error: 'not-found',
          message: 'Category not found.'
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

    if (error.message === 'initial-category-delete-forbidden') {
      return {
        status: 422,
        body: {
          error: 'initial-category-delete-forbidden',
          message: 'Initial categories cannot be deleted.'
        }
      };
    }

    if (error.message === 'category-in-use') {
      return {
        status: 409,
        body: {
          error: 'category-in-use',
          message: 'Categories with contractors, bookings or emergencies cannot be deleted.'
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

  const parsedBody = adminCategoryUpdateSchema.safeParse(await request.json());

  if (!parsedBody.success) {
    return jsonResponse(
      {
        error: 'invalid-request',
        issues: parsedBody.error.flatten()
      },
      { status: 400 }
    );
  }

  const { categoryId } = await params;
  const prisma = getPrismaClient();

  try {
    const category = await updateCategoryForAdmin(prisma, auth.permissionContext, categoryId, parsedBody.data);

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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

  const { categoryId } = await params;
  const prisma = getPrismaClient();

  try {
    const category = await deleteCategoryForAdmin(prisma, auth.permissionContext, categoryId);

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
