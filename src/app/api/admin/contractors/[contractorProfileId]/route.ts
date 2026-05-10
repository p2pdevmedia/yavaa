import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { contractorReviewSchema, reviewContractorProfileForAdmin } from '@/lib/admin-contractors';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

type RouteParams = {
  params: Promise<{
    contractorProfileId: string;
  }>;
};

function mapAdminContractorReviewError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Contractor review payload is invalid.'
      }
    };
  }

  if (error instanceof Error) {
    if (error.message === 'forbidden') {
      return {
        status: 403,
        body: {
          error: 'forbidden',
          message: 'Only active admins can review contractor profiles.'
        }
      };
    }

    if (error.message === 'contractor-profile-not-found') {
      return {
        status: 404,
        body: {
          error: 'not-found',
          message: 'Contractor profile not found.'
        }
      };
    }

    if (error.message === 'invalid-state') {
      return {
        status: 422,
        body: {
          error: 'invalid-state',
          message: 'Draft or pending contractor profiles can be reviewed, and approved profiles can be rejected.'
        }
      };
    }
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not review the contractor profile.'
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
        message: 'Only active admins can review contractor profiles.'
      },
      { status: 403 }
    );
  }

  const { contractorProfileId } = await params;
  const prisma = getPrismaClient();

  try {
    const parsedBody = contractorReviewSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return jsonResponse(
        {
          error: 'invalid-request',
          issues: parsedBody.error.flatten()
        },
        { status: 400 }
      );
    }

    const contractorProfile = await reviewContractorProfileForAdmin(
      prisma,
      auth.permissionContext,
      contractorProfileId,
      parsedBody.data
    );

    return jsonResponse(
      {
        contractorProfile
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapAdminContractorReviewError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
