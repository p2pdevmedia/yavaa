import { ContractorApprovalStatus, type PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { canReviewContractorApplication, type PermissionContext } from '@/lib/permissions';

export type AdminContractorActor = PermissionContext;

export const contractorReviewSchema = z.object({
  approvalStatus: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().trim().max(1000).nullable().optional()
});

export const contractorListFiltersSchema = z.object({
  approvalStatus: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']).optional()
});

export type AdminContractorProfileSummary = {
  id: string;
  approvalStatus: ContractorApprovalStatus;
  acceptsEmergencies: boolean;
  dniNumber: string | null;
  dniFrontUrl: string | null;
  dniBackUrl: string | null;
  profilePhotoUrl: string | null;
  reviewNotes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    status: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
    } | null;
  };
  address: {
    id: string;
    label: string;
    city: string;
    province: string;
    marketSlug: string | null;
    marketCity: string | null;
    marketProvince: string | null;
  } | null;
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    group: string | null;
    isPrimary: boolean;
  }>;
  workZones: Array<{
    id: string;
    slug: string;
    name: string;
    marketSlug: string;
  }>;
};

export type AdminContractorReviewResult = {
  id: string;
  approvalStatus: ContractorApprovalStatus;
  reviewNotes: string | null;
  reviewedAt: string | null;
  reviewedByUserId: string | null;
};

type AdminContractorProfileRow = {
  id: string;
  approvalStatus: ContractorApprovalStatus;
  acceptsEmergencies: boolean;
  dniNumber: string | null;
  dniFrontUrl: string | null;
  dniBackUrl: string | null;
  profilePhotoUrl: string | null;
  reviewNotes: string | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    displayName: string | null;
    status: string;
    profile: {
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
    } | null;
  };
  address: {
    id: string;
    label: string;
    city: string;
    province: string;
    market: {
      slug: string;
      city: string;
      province: string;
    } | null;
  } | null;
  categories: Array<{
    isPrimary: boolean;
    category: {
      id: string;
      slug: string;
      name: string;
      group: string | null;
    };
  }>;
  workZones: Array<{
    workZone: {
      id: string;
      slug: string;
      name: string;
      market: {
        slug: string;
      };
    };
  }>;
};

type AdminContractorReviewRow = {
  id: string;
  approvalStatus: ContractorApprovalStatus;
  reviewNotes: string | null;
  reviewedAt: Date | null;
  reviewedByUserId: string | null;
};

const adminContractorProfileSelect = {
  id: true,
  approvalStatus: true,
  acceptsEmergencies: true,
  dniNumber: true,
  dniFrontUrl: true,
  dniBackUrl: true,
  profilePhotoUrl: true,
  reviewNotes: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedByUserId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      displayName: true,
      status: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          phone: true
        }
      }
    }
  },
  address: {
    select: {
      id: true,
      label: true,
      city: true,
      province: true,
      market: {
        select: {
          slug: true,
          city: true,
          province: true
        }
      }
    }
  },
  categories: {
    select: {
      isPrimary: true,
      category: {
        select: {
          id: true,
          slug: true,
          name: true,
          group: true
        }
      }
    }
  },
  workZones: {
    select: {
      workZone: {
        select: {
          id: true,
          slug: true,
          name: true,
          market: {
            select: {
              slug: true
            }
          }
        }
      }
    }
  }
} as const;

const adminContractorReviewSelect = {
  id: true,
  approvalStatus: true,
  reviewNotes: true,
  reviewedAt: true,
  reviewedByUserId: true
} as const;

function assertCanReviewContractors(actor: AdminContractorActor): void {
  if (!canReviewContractorApplication(actor)) {
    throw new Error('forbidden');
  }
}

function toIsoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function serializeContractorProfile(row: AdminContractorProfileRow): AdminContractorProfileSummary {
  return {
    id: row.id,
    approvalStatus: row.approvalStatus,
    acceptsEmergencies: row.acceptsEmergencies,
    dniNumber: row.dniNumber,
    dniFrontUrl: row.dniFrontUrl,
    dniBackUrl: row.dniBackUrl,
    profilePhotoUrl: row.profilePhotoUrl,
    reviewNotes: row.reviewNotes,
    submittedAt: toIsoOrNull(row.submittedAt),
    reviewedAt: toIsoOrNull(row.reviewedAt),
    reviewedByUserId: row.reviewedByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: row.user,
    address: row.address
      ? {
          id: row.address.id,
          label: row.address.label,
          city: row.address.city,
          province: row.address.province,
          marketSlug: row.address.market?.slug ?? null,
          marketCity: row.address.market?.city ?? null,
          marketProvince: row.address.market?.province ?? null
        }
      : null,
    categories: row.categories.map((entry) => ({
      id: entry.category.id,
      slug: entry.category.slug,
      name: entry.category.name,
      group: entry.category.group,
      isPrimary: entry.isPrimary
    })),
    workZones: row.workZones.map((entry) => ({
      id: entry.workZone.id,
      slug: entry.workZone.slug,
      name: entry.workZone.name,
      marketSlug: entry.workZone.market.slug
    }))
  };
}

function serializeContractorReview(row: AdminContractorReviewRow): AdminContractorReviewResult {
  return {
    id: row.id,
    approvalStatus: row.approvalStatus,
    reviewNotes: row.reviewNotes,
    reviewedAt: toIsoOrNull(row.reviewedAt),
    reviewedByUserId: row.reviewedByUserId
  };
}

function canReviewProfileTransition(
  currentStatus: ContractorApprovalStatus,
  nextStatus: ContractorApprovalStatus
): boolean {
  if (
    currentStatus === ContractorApprovalStatus.DRAFT ||
    currentStatus === ContractorApprovalStatus.PENDING_REVIEW
  ) {
    return true;
  }

  return currentStatus === ContractorApprovalStatus.APPROVED && nextStatus === ContractorApprovalStatus.REJECTED;
}

export async function listContractorProfilesForAdmin(
  prisma: PrismaClient,
  actor: AdminContractorActor,
  filters: z.infer<typeof contractorListFiltersSchema>
): Promise<AdminContractorProfileSummary[]> {
  assertCanReviewContractors(actor);

  const parsed = contractorListFiltersSchema.parse(filters);
  const rows = (await prisma.contractorProfile.findMany({
    where: parsed.approvalStatus
      ? {
          approvalStatus: parsed.approvalStatus as ContractorApprovalStatus
        }
      : undefined,
    orderBy: [
      { submittedAt: 'desc' },
      { createdAt: 'desc' }
    ],
    select: adminContractorProfileSelect
  })) as AdminContractorProfileRow[];

  return rows.map(serializeContractorProfile);
}

export async function reviewContractorProfileForAdmin(
  prisma: PrismaClient,
  actor: AdminContractorActor,
  contractorProfileId: string,
  input: z.infer<typeof contractorReviewSchema>
): Promise<AdminContractorReviewResult> {
  assertCanReviewContractors(actor);

  const parsed = contractorReviewSchema.parse(input);
  const nextStatus = parsed.approvalStatus as ContractorApprovalStatus;

  const currentProfile = await prisma.contractorProfile.findUnique({
    where: {
      id: contractorProfileId
    },
    select: {
      id: true,
      approvalStatus: true
    }
  });

  if (!currentProfile) {
    throw new Error('contractor-profile-not-found');
  }

  if (!canReviewProfileTransition(currentProfile.approvalStatus, nextStatus)) {
    throw new Error('invalid-state');
  }

  const updatedProfile = (await prisma.contractorProfile.update({
    where: {
      id: contractorProfileId
    },
    data: {
      approvalStatus: nextStatus,
      reviewNotes: parsed.reviewNotes ?? null,
      reviewedByUserId: actor.userId,
      reviewedAt: new Date()
    },
    select: adminContractorReviewSelect
  })) as AdminContractorReviewRow;

  await recordAuditLog({
    actorUserId: actor.userId,
    action:
      updatedProfile.approvalStatus === ContractorApprovalStatus.APPROVED
        ? 'contractor_profile.approved'
        : 'contractor_profile.rejected',
    entityType: 'contractor_profile',
    entityId: contractorProfileId,
    metadata: {
      previousApprovalStatus: currentProfile.approvalStatus,
      nextApprovalStatus: updatedProfile.approvalStatus,
      reviewNotes: updatedProfile.reviewNotes
    }
  });

  return serializeContractorReview(updatedProfile);
}
