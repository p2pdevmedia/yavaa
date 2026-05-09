import { ContractorApprovalStatus } from '@prisma/client';
import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { canReviewContractorApplication } from '@/lib/permissions';
import { resolveRequestAuth } from '@/lib/request-auth';

const contractorReviewSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().trim().max(1000).nullable().optional()
});

type RouteParams = {
  params: Promise<{
    contractorProfileId: string;
  }>;
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !canReviewContractorApplication(auth.permissionContext)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'Only active admins can review contractor profiles.'
      },
      { status: 403 }
    );
  }

  const { contractorProfileId } = await params;
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

  const prisma = getPrismaClient();
  const data = parsedBody.data;

  const contractorProfile = await prisma.contractorProfile.findUnique({
    where: {
      id: contractorProfileId
    },
    select: {
      id: true,
      userId: true
    }
  });

  if (!contractorProfile) {
    return jsonResponse(
      {
        error: 'not-found',
        message: 'Contractor profile not found.'
      },
      { status: 404 }
    );
  }

  const updatedProfile = await prisma.contractorProfile.update({
    where: {
      id: contractorProfileId
    },
    data: {
      approvalStatus:
        data.approvalStatus === 'APPROVED'
          ? ContractorApprovalStatus.APPROVED
          : ContractorApprovalStatus.REJECTED,
      reviewNotes: data.reviewNotes ?? null,
      reviewedByUserId: auth.permissionContext?.userId ?? null,
      reviewedAt: new Date()
    },
    select: {
      id: true,
      approvalStatus: true,
      reviewNotes: true,
      reviewedAt: true,
      reviewedByUserId: true
    }
  });

  await recordAuditLog({
    actorUserId: auth.permissionContext?.userId ?? null,
    action:
      updatedProfile.approvalStatus === ContractorApprovalStatus.APPROVED
        ? 'contractor_profile.approved'
        : 'contractor_profile.rejected',
    entityType: 'contractor_profile',
    entityId: contractorProfileId,
      metadata: {
      reviewedByUserId: auth.permissionContext?.userId ?? null,
      approvalStatus: updatedProfile.approvalStatus,
      reviewNotes: updatedProfile.reviewNotes
    }
  });

  return jsonResponse(
    {
      contractorProfile: updatedProfile
    },
    { status: 200 }
  );
}
