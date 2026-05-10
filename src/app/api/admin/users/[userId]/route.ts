import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import {
  deleteAdminUserSchema,
  deleteUserForAdmin,
  getUserForAdmin,
  updateAdminUserProfileSchema,
  updateAdminUserStatusSchema,
  updateUserProfileForAdmin,
  updateUserStatusForAdmin
} from '@/lib/admin-users';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';
import { getSupabaseServiceClient } from '@/lib/supabase';

type RouteParams = {
  params: Promise<{
    userId: string;
  }>;
};

function mapAdminUserError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'User payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'Only active admins can manage users.'
        }
      };
    }

    if (error.message === 'user-not-found') {
      return {
        status: 404,
        body: {
          error: 'not-found',
          message: 'User not found.'
        }
      };
    }

    if (error.message === 'reason-required') {
      return {
        status: 422,
        body: {
          error: 'reason-required',
          message: 'A reason is required when suspending or blocking a user.'
        }
      };
    }

    if (error.message === 'self-status-change-forbidden') {
      return {
        status: 422,
        body: {
          error: 'self-status-change-forbidden',
          message: 'Admins cannot suspend or block their own account.'
        }
      };
    }

    if (error.message === 'self-delete-forbidden') {
      return {
        status: 422,
        body: {
          error: 'self-delete-forbidden',
          message: 'Admins cannot delete their own account.'
        }
      };
    }

    if (error.message === 'supabase-auth-delete-failed') {
      return {
        status: 502,
        body: {
          error: 'supabase-auth-delete-failed',
          message: 'Supabase Auth user could not be deleted.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not update the user status.'
    }
  };
}

async function readOptionalJsonBody(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'Only active admins can manage users.'
      },
      { status: 403 }
    );
  }

  const { userId } = await params;
  const prisma = getPrismaClient();

  try {
    const user = await getUserForAdmin(prisma, auth.permissionContext, userId);

    return jsonResponse(
      {
        user
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapAdminUserError(error);

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
        message: 'Only active admins can manage users.'
      },
      { status: 403 }
    );
  }

  const parsedBody = deleteAdminUserSchema.safeParse(await readOptionalJsonBody(request));

  if (!parsedBody.success) {
    return jsonResponse(
      {
        error: 'invalid-request',
        issues: parsedBody.error.flatten()
      },
      { status: 400 }
    );
  }

  const { userId } = await params;
  const prisma = getPrismaClient();

  try {
    const deletion = await deleteUserForAdmin(prisma, auth.permissionContext, userId, {
      ...parsedBody.data,
      supabaseAuthAdmin: getSupabaseServiceClient().auth.admin
    });

    return jsonResponse(
      {
        user: deletion
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapAdminUserError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
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
        message: 'Only active admins can manage users.'
      },
      { status: 403 }
    );
  }

  const { userId } = await params;
  const prisma = getPrismaClient();

  try {
    const rawBody = await request.json();
    let user;

    if (rawBody && typeof rawBody === 'object' && 'status' in rawBody) {
      const parsedBody = updateAdminUserStatusSchema.safeParse(rawBody);

      if (!parsedBody.success) {
        return jsonResponse(
          {
            error: 'invalid-request',
            issues: parsedBody.error.flatten()
          },
          { status: 400 }
        );
      }

      user = await updateUserStatusForAdmin(prisma, auth.permissionContext, userId, parsedBody.data);
    } else {
      const parsedBody = updateAdminUserProfileSchema.safeParse(rawBody);

      if (!parsedBody.success) {
        return jsonResponse(
          {
            error: 'invalid-request',
            issues: parsedBody.error.flatten()
          },
          { status: 400 }
        );
      }

      user = await updateUserProfileForAdmin(prisma, auth.permissionContext, userId, parsedBody.data);
    }

    return jsonResponse(
      {
        user
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapAdminUserError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
