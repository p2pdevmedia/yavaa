import { type NextRequest } from 'next/server';
import { ZodError } from 'zod';

import { contractorListFiltersSchema, listContractorProfilesForAdmin } from '@/lib/admin-contractors';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

function mapAdminContractorListError(error: unknown): { status: number; body: { error: string; message: string } } {
  if (error instanceof ZodError) {
    return {
      status: 400,
      body: {
        error: 'invalid-request',
        message: 'Contractor list filters are invalid.'
      }
    };
  }

  if (error instanceof Error && error.message === 'forbidden') {
    return {
      status: 403,
      body: {
        error: 'forbidden',
        message: 'Only active admins can review contractor profiles.'
      }
    };
  }

  return {
    status: 500,
    body: {
      error: 'internal-error',
      message: 'We could not list contractor profiles.'
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
        message: 'Only active admins can review contractor profiles.'
      },
      { status: 403 }
    );
  }

  const prisma = getPrismaClient();
  const searchParams = request.nextUrl.searchParams;

  try {
    const parsedFilters = contractorListFiltersSchema.safeParse({
      approvalStatus: searchParams.get('approvalStatus') ?? undefined
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

    const contractorProfiles = await listContractorProfilesForAdmin(
      prisma,
      auth.permissionContext,
      parsedFilters.data
    );

    return jsonResponse(
      {
        contractorProfiles
      },
      { status: 200 }
    );
  } catch (error) {
    const mapped = mapAdminContractorListError(error);

    return jsonResponse(mapped.body, { status: mapped.status });
  }
}
