import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import {
  createEmergencyRequest,
  createEmergencyRequestSchema,
  emergencyListModeSchema,
  listEmergencyRequestsForActor
} from '@/lib/emergencies';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

function mapEmergencyError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Emergency request payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'You cannot create or view emergency requests with this account state.'
        }
      };
    }

    if (error.message === 'invalid-address' || error.message === 'invalid-category' || error.message === 'invalid-address-market') {
      return {
        status: 422,
        body: {
          error: error.message,
          message: 'The selected emergency context is not valid.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not process the emergency request.'
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
        message: 'You need an active linked account to view emergency requests.'
      },
      { status: 403 }
    );
  }

  const prisma = getPrismaClient();
  const parsedMode = emergencyListModeSchema.optional().safeParse(request.nextUrl.searchParams.get('mode') ?? undefined);

  if (!parsedMode.success) {
    return jsonResponse(
      {
        error: 'invalid-request',
        message: 'Emergency list mode is invalid.'
      },
      { status: 400 }
    );
  }

  const requests = await listEmergencyRequestsForActor(prisma, auth.permissionContext, { mode: parsedMode.data });

  return jsonResponse(
    {
      requests
    },
    { status: 200 }
  );
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
        message: 'You need an active linked account to create emergency requests.'
      },
      { status: 403 }
    );
  }

  const parsedBody = createEmergencyRequestSchema.safeParse(await request.json());

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
    const requestRecord = await createEmergencyRequest(prisma, auth.permissionContext, parsedBody.data);

    return jsonResponse(
      {
        request: requestRecord
      },
      { status: 201 }
    );
  } catch (error) {
    const mapped = mapEmergencyError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
