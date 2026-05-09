import { type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';

import { emergencyReassignSchema, reassignEmergencyRequest } from '@/lib/emergencies';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { canReassignEmergencyRequest } from '@/lib/permissions';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteContext = {
  params: Promise<{
    emergencyRequestId: string;
  }>;
};

const adminEmergencyReassignSchema = z.object({
  reason: emergencyReassignSchema.shape.reason
});

function mapEmergencyReassignError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Emergency reassignment payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'Only active admins can reassign emergency requests.'
        }
      };
    }

    if (error.message === 'not-found') {
      return {
        status: 404,
        body: {
          error: 'not-found',
          message: 'Emergency request not found.'
        }
      };
    }

    if (error.message === 'invalid-state') {
      return {
        status: 422,
        body: {
          error: 'invalid-state',
          message: 'The emergency request cannot be reassigned in its current state.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not process the emergency reassignment.'
    }
  };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !canReassignEmergencyRequest(auth.permissionContext)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'Only active admins can reassign emergency requests.'
      },
      { status: 403 }
    );
  }

  const { emergencyRequestId } = await params;
  const parsedBody = adminEmergencyReassignSchema.safeParse(await request.json());

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

  try {
    const requestRecord = await reassignEmergencyRequest(
      prisma,
      auth.permissionContext,
      emergencyRequestId,
      parsedBody.data.reason
    );

    return jsonResponse(
      {
        request: requestRecord
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapEmergencyReassignError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
