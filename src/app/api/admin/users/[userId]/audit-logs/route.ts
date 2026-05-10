import { type NextRequest } from 'next/server';

import { listUserAuditLogsForAdmin } from '@/lib/admin-users';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteParams = {
  params: Promise<{
    userId: string;
  }>;
};

function mapAdminUserAuditLogError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof Error && error.message === 'forbidden') {
    return {
      status: 403,
      body: {
        error: 'forbidden',
        message: 'Only active admins can manage users.'
      }
    };
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not load user audit activity.'
    }
  };
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

  try {
    const auditLogs = await listUserAuditLogsForAdmin(getPrismaClient(), auth.permissionContext, userId);

    return jsonResponse(
      {
        auditLogs
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapAdminUserAuditLogError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
