import { type NextRequest } from 'next/server';

import { listUsersForAdmin } from '@/lib/admin-users';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

export async function GET(request: NextRequest) {
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

  const prisma = getPrismaClient();

  try {
    const users = await listUsersForAdmin(prisma, auth.permissionContext);

    return jsonResponse(
      {
        users
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'forbidden') {
      return jsonResponse(
        {
          error: 'forbidden',
          message: 'Only active admins can manage users.'
        },
        { status: 403 }
      );
    }

    throw error;
  }
}
