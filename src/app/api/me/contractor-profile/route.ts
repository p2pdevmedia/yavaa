import { CategoryStatus, ContractorApprovalStatus } from '@prisma/client';
import { type NextRequest } from 'next/server';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { ensureContractorRoleForUser } from '@/lib/contractor-profile';
import {
  uploadContractorProfileFileToBlob,
  validateContractorProfileFile
} from '@/lib/contractor-profile-file-storage';
import { jsonResponse } from '@/lib/http';
import { getPrismaClient } from '@/lib/prisma';
import { canManageContractorProfile } from '@/lib/permissions';
import { resolveRequestAuth } from '@/lib/request-auth';
import { resolveAppUser } from '@/lib/app-user';

const contractorProfileUpdateSchema = z.object({
  acceptsEmergencies: z.boolean().optional().default(false),
  addressId: z.string().uuid().nullable().optional(),
  hourlyRateCents: z.number().int().min(0).max(2_000_000_000).nullable().optional(),
  categoryIds: z.array(z.string().uuid()).max(20).optional(),
  dniNumber: z.string().trim().min(6).max(32).nullable().optional(),
  dniFrontUrl: z.string().url().nullable().optional(),
  dniBackUrl: z.string().url().nullable().optional(),
  reviewNotes: z.string().trim().max(1000).nullable().optional(),
  submitForReview: z.boolean().optional().default(false)
});

type ContractorProfileFileInputs = {
  dniFrontFile?: File;
  dniBackFile?: File;
};

function formValueToNullableString(value: FormDataEntryValue | null): string | null | undefined {
  if (value === null || value instanceof File) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formValueToBoolean(value: FormDataEntryValue | null): boolean | undefined {
  if (value === null || value instanceof File) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (normalized === '') {
    return undefined;
  }

  if (normalized === 'true') {
    return true;
  }

  if (normalized === 'false') {
    return false;
  }

  return undefined;
}

function formValueToNullableInteger(value: FormDataEntryValue | null): number | null | undefined {
  if (value === null || value instanceof File) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

function parseCategoryIdsJson(value: FormDataEntryValue | null): string[] | undefined {
  if (value === null || value instanceof File) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && parsed.every((item) => typeof item === 'string') ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function getFormCategoryIds(formData: FormData): string[] | undefined {
  const jsonCategoryIds = parseCategoryIdsJson(formData.get('categoryIdsJson'));

  if (jsonCategoryIds) {
    return jsonCategoryIds;
  }

  const categoryIds = formData
    .getAll('categoryIds')
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

  return categoryIds.length > 0 ? categoryIds : undefined;
}

function getOptionalFile(formData: FormData, fieldName: string): File | undefined {
  const value = formData.get(fieldName);
  return value instanceof File && value.size > 0 ? value : undefined;
}

async function parseContractorProfileUpdateRequest(request: NextRequest): Promise<
  | {
      success: true;
      data: z.infer<typeof contractorProfileUpdateSchema>;
      files: ContractorProfileFileInputs;
    }
  | {
      success: false;
      issues: unknown;
    }
> {
  const contentType = (request as { headers?: Headers }).headers?.get('content-type') ?? '';

  if (!contentType.toLowerCase().includes('multipart/form-data')) {
    const parsedBody = contractorProfileUpdateSchema.safeParse(await request.json());

    if (!parsedBody.success) {
      return {
        success: false,
        issues: parsedBody.error.flatten()
      };
    }

    return {
      success: true,
      data: parsedBody.data,
      files: {}
    };
  }

  const formData = await request.formData();
  const files: ContractorProfileFileInputs = {
    dniFrontFile: getOptionalFile(formData, 'dniFrontFile'),
    dniBackFile: getOptionalFile(formData, 'dniBackFile')
  };
  const parsedBody = contractorProfileUpdateSchema.safeParse({
    acceptsEmergencies: formValueToBoolean(formData.get('acceptsEmergencies')),
    addressId: formValueToNullableString(formData.get('addressId')),
    hourlyRateCents: formValueToNullableInteger(formData.get('hourlyRateCents')),
    categoryIds: getFormCategoryIds(formData),
    dniNumber: formValueToNullableString(formData.get('dniNumber')),
    reviewNotes: formValueToNullableString(formData.get('reviewNotes')),
    submitForReview: formValueToBoolean(formData.get('submitForReview'))
  });

  if (!parsedBody.success) {
    return {
      success: false,
      issues: parsedBody.error.flatten()
    };
  }

  const fileIssues: Record<string, string[]> = {};
  const dniFrontIssue = files.dniFrontFile ? validateContractorProfileFile('dni-front', files.dniFrontFile) : null;
  const dniBackIssue = files.dniBackFile ? validateContractorProfileFile('dni-back', files.dniBackFile) : null;

  if (dniFrontIssue) {
    fileIssues.dniFrontFile = [dniFrontIssue];
  }

  if (dniBackIssue) {
    fileIssues.dniBackFile = [dniBackIssue];
  }

  if (Object.keys(fileIssues).length > 0) {
    return {
      success: false,
      issues: {
        fieldErrors: fileIssues,
        formErrors: []
      }
    };
  }

  return {
    success: true,
    data: parsedBody.data,
    files
  };
}

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
  const parsedBody = await parseContractorProfileUpdateRequest(request);

  if (!parsedBody.success) {
    return jsonResponse(
      {
        error: 'invalid-request',
        issues: parsedBody.issues
      },
      { status: 400 }
    );
  }

  const prisma = getPrismaClient();
  const data = parsedBody.data;
  const categoryIds =
    data.categoryIds === undefined ? undefined : Array.from(new Set(data.categoryIds.filter((id) => id.length > 0)));

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

  if (categoryIds !== undefined && categoryIds.length > 0) {
    const activeCategories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryIds
        },
        status: CategoryStatus.ACTIVE
      },
      select: {
        id: true
      }
    });

    if (activeCategories.length !== categoryIds.length) {
      return jsonResponse(
        {
          error: 'invalid-categories',
          message: 'All selected contractor categories must be active catalog categories.'
        },
        { status: 422 }
      );
    }
  }

  const uploadedDniFront = parsedBody.files.dniFrontFile
    ? await uploadContractorProfileFileToBlob(appUser.id, 'dni-front', parsedBody.files.dniFrontFile)
    : null;
  const uploadedDniBack = parsedBody.files.dniBackFile
    ? await uploadContractorProfileFileToBlob(appUser.id, 'dni-back', parsedBody.files.dniBackFile)
    : null;
  const profilePhotoUrl = appUser.profile?.avatarUrl ?? null;
  const contractorProfileData = {
    ...data,
    profilePhotoUrl,
    dniFrontUrl: uploadedDniFront?.storageUrl ?? data.dniFrontUrl,
    dniBackUrl: uploadedDniBack?.storageUrl ?? data.dniBackUrl
  };

  await prisma.$transaction(async (tx) => {
    const contractorProfile = await tx.contractorProfile.upsert({
      where: {
        userId: appUser.id
      },
      update: {
        acceptsEmergencies: contractorProfileData.acceptsEmergencies,
        addressId: contractorProfileData.addressId ?? undefined,
        hourlyRateCents:
          contractorProfileData.hourlyRateCents === undefined ? undefined : contractorProfileData.hourlyRateCents,
        dniNumber: contractorProfileData.dniNumber ?? undefined,
        dniFrontUrl: contractorProfileData.dniFrontUrl ?? undefined,
        dniBackUrl: contractorProfileData.dniBackUrl ?? undefined,
        profilePhotoUrl: contractorProfileData.profilePhotoUrl,
        reviewNotes: contractorProfileData.reviewNotes ?? undefined,
        approvalStatus: contractorProfileData.submitForReview ? ContractorApprovalStatus.PENDING_REVIEW : undefined,
        submittedAt: contractorProfileData.submitForReview ? new Date() : undefined
      },
      create: {
        userId: appUser.id,
        acceptsEmergencies: contractorProfileData.acceptsEmergencies,
        addressId: contractorProfileData.addressId ?? null,
        hourlyRateCents: contractorProfileData.hourlyRateCents ?? null,
        dniNumber: contractorProfileData.dniNumber ?? null,
        dniFrontUrl: contractorProfileData.dniFrontUrl ?? null,
        dniBackUrl: contractorProfileData.dniBackUrl ?? null,
        profilePhotoUrl: contractorProfileData.profilePhotoUrl ?? null,
        reviewNotes: contractorProfileData.reviewNotes ?? null,
        approvalStatus: contractorProfileData.submitForReview
          ? ContractorApprovalStatus.PENDING_REVIEW
          : ContractorApprovalStatus.DRAFT,
        submittedAt: contractorProfileData.submitForReview ? new Date() : null
      }
    });

    if (categoryIds !== undefined) {
      await tx.contractorCategory.deleteMany({
        where: {
          contractorProfileId: contractorProfile.id
        }
      });

      if (categoryIds.length > 0) {
        await tx.contractorCategory.createMany({
          data: categoryIds.map((categoryId, index) => ({
            contractorProfileId: contractorProfile.id,
            categoryId,
            isPrimary: index === 0
          }))
        });
      }
    }

    await ensureContractorRoleForUser(tx, appUser.id);
  });

  await recordAuditLog({
    actorUserId: appUser.id,
    action: contractorProfileData.submitForReview ? 'contractor_profile.submitted' : 'contractor_profile.updated',
    entityType: 'contractor_profile',
    entityId: appUser.id,
    metadata: {
      addressChanged: contractorProfileData.addressId !== undefined,
      categoriesChanged: categoryIds !== undefined,
      contractorRoleEnsured: true,
      hourlyRateChanged: contractorProfileData.hourlyRateCents !== undefined,
      submittedForReview: contractorProfileData.submitForReview
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
