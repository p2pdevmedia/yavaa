import { ContractorApprovalStatus } from '@prisma/client';
import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { canManageContractorProfile } from '@/lib/permissions';
import { resolveRequestAuth } from '@/lib/request-auth';
import { resolveAppUser } from '@/lib/app-user';

const contractorProfileUpdateSchema = z.object({
  addressId: z.string().uuid().nullable().optional(),
  dniNumber: z.string().trim().min(6).max(32).nullable().optional(),
  dniFrontUrl: z.string().url().nullable().optional(),
  dniBackUrl: z.string().url().nullable().optional(),
  profilePhotoUrl: z.string().url().nullable().optional(),
  reviewNotes: z.string().trim().max(1000).nullable().optional(),
  submitForReview: z.boolean().optional().default(false)
});

export async function GET(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !auth.appUser || !canManageContractorProfile(auth.permissionContext, auth.appUser.id)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only access your own contractor profile while active.'
      },
      { status: 403 }
    );
  }

  return jsonResponse(
    {
      contractorProfile: auth.appUser.contractorProfile
    },
    { status: 200 }
  );
}

export async function PATCH(request: NextRequest) {
  const auth = await resolveRequestAuth(request);

  if (!auth.authenticated) {
    return jsonResponse(auth, { status: 401 });
  }

  if (!auth.permissionContext || !auth.appUser || !canManageContractorProfile(auth.permissionContext, auth.appUser.id)) {
    return jsonResponse(
      {
        error: 'forbidden',
        message: 'You can only update your own contractor profile while active.'
      },
      { status: 403 }
    );
  }

  const appUser = auth.appUser;
  const parsedBody = contractorProfileUpdateSchema.safeParse(await request.json());

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

  if (data.addressId) {
    const ownershipCheck = await prisma.address.findFirst({
        where: {
          id: data.addressId,
          userId: appUser.id
        },
      select: {
        id: true
      }
    });

    if (!ownershipCheck) {
      return jsonResponse(
        {
          error: 'invalid-address',
          message: 'The selected address does not belong to the authenticated user.'
        },
        { status: 422 }
      );
    }
  }

  await prisma.contractorProfile.upsert({
    where: {
      userId: appUser.id
    },
    update: {
      addressId: data.addressId ?? undefined,
      dniNumber: data.dniNumber ?? undefined,
      dniFrontUrl: data.dniFrontUrl ?? undefined,
      dniBackUrl: data.dniBackUrl ?? undefined,
      profilePhotoUrl: data.profilePhotoUrl ?? undefined,
      reviewNotes: data.reviewNotes ?? undefined,
      approvalStatus: data.submitForReview ? ContractorApprovalStatus.PENDING_REVIEW : undefined,
      submittedAt: data.submitForReview ? new Date() : undefined
    },
    create: {
      userId: appUser.id,
      addressId: data.addressId ?? null,
      dniNumber: data.dniNumber ?? null,
      dniFrontUrl: data.dniFrontUrl ?? null,
      dniBackUrl: data.dniBackUrl ?? null,
      profilePhotoUrl: data.profilePhotoUrl ?? null,
      reviewNotes: data.reviewNotes ?? null,
      approvalStatus: data.submitForReview ? ContractorApprovalStatus.PENDING_REVIEW : ContractorApprovalStatus.DRAFT,
      submittedAt: data.submitForReview ? new Date() : null
    }
  });

  await recordAuditLog({
    actorUserId: appUser.id,
    action: data.submitForReview ? 'contractor_profile.submitted' : 'contractor_profile.updated',
    entityType: 'contractor_profile',
    entityId: appUser.id,
    metadata: {
      addressChanged: data.addressId !== undefined,
      submittedForReview: data.submitForReview
    }
  });

  const refreshed = await resolveAppUser(auth.identity);

  return jsonResponse(
    {
      authenticated: true,
      configured: refreshed.configured,
      matchedBy: refreshed.matchedBy,
      identity: refreshed.identity,
      appUser: refreshed.user,
      permissionContext: refreshed.permissionContext
    },
    { status: 200 }
  );
}
