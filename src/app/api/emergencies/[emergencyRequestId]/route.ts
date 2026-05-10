import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import {
  cancelEmergencyRequest,
  emergencyOwnerPatchSchema,
  loadEmergencyRequest,
  republishEmergencyRequest,
  resolveEmergencyRequest,
  updateEmergencyRequest
} from '@/lib/emergencies';
import { canViewEmergencyRequest } from '@/lib/permissions';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteContext = {
  params: Promise<{
    emergencyRequestId: string;
  }>;
};

function mapEmergencyMutationError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError || error instanceof SyntaxError) {
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
          message: 'You cannot change this emergency request.'
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
          message: 'The emergency request cannot be changed in its current state.'
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

export async function GET(request: NextRequest, { params }: RouteContext) {
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

  const { emergencyRequestId } = await params;
  const prisma = getPrismaClient();
  const row = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!row) {
    return jsonResponse(
      {
        error: 'not-found',
        message: 'Emergency request not found.'
      },
      { status: 404 }
    );
  }

  const isVisible = canViewEmergencyRequest(auth.permissionContext, {
    clientUserId: row.client.id,
    assignedContractorUserId: row.assignedContractorProfile?.user.id ?? null,
    notifiedContractorUserIds: row.candidates.map((candidate) => candidate.contractorProfile.user.id)
  });

  if (!isVisible) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You cannot view this emergency request.'
      },
      { status: 403 }
    );
  }

  return jsonResponse(
    {
      request: row
    },
    { status: 200 }
  );
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
        message: 'You need an active linked account to cancel emergency requests.'
      },
      { status: 403 }
    );
  }

  const { emergencyRequestId } = await params;
  const prisma = getPrismaClient();

  try {
    const rawBody = await request.text();
    const parsedBody = rawBody.trim().length > 0
      ? emergencyOwnerPatchSchema.parse(JSON.parse(rawBody) as unknown)
      : { action: 'cancel' as const };
    const requestRecord = parsedBody.action === 'update'
      ? await updateEmergencyRequest(prisma, auth.permissionContext, emergencyRequestId, {
          categoryId: parsedBody.categoryId,
          addressId: parsedBody.addressId,
          description: parsedBody.description
        })
      : parsedBody.action === 'resolve'
        ? await resolveEmergencyRequest(prisma, auth.permissionContext, emergencyRequestId)
        : parsedBody.action === 'republish'
          ? await republishEmergencyRequest(prisma, auth.permissionContext, emergencyRequestId)
          : await cancelEmergencyRequest(prisma, auth.permissionContext, emergencyRequestId);

    return jsonResponse(
      {
        request: requestRecord
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapEmergencyMutationError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You need an active linked account to delete emergency requests.'
      },
      { status: 403 }
    );
  }

  const { emergencyRequestId } = await params;
  const prisma = getPrismaClient();

  try {
    const requestRecord = await cancelEmergencyRequest(prisma, auth.permissionContext, emergencyRequestId);

    return jsonResponse(
      {
        request: requestRecord
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapEmergencyMutationError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
