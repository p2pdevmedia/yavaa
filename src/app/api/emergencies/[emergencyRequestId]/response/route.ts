import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { emergencyResponseSchema, respondToEmergencyRequest } from '@/lib/emergencies';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteContext = {
  params: Promise<{
    emergencyRequestId: string;
  }>;
};

function mapEmergencyResponseError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Emergency response payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'You cannot respond to this emergency request.'
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
          message: 'The emergency request cannot be answered in its current state.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not process the emergency response.'
    }
  };
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You need an active linked account to respond to emergency requests.'
      },
      { status: 403 }
    );
  }

  const { emergencyRequestId } = await params;
  const parsedBody = emergencyResponseSchema.safeParse(await request.json());

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
    const requestRecord = await respondToEmergencyRequest(
      prisma,
      auth.permissionContext,
      emergencyRequestId,
      parsedBody.data.action,
      parsedBody.data.note ?? null
    );

    return jsonResponse(
      {
        request: requestRecord
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapEmergencyResponseError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
