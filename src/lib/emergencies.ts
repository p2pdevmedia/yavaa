import { Prisma, UserStatus, type PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import {
  canCreateEmergencyRequest,
  canReassignEmergencyRequest,
  canRespondToEmergencyRequest,
  canViewEmergencyRequest,
  type PermissionContext
} from '@/lib/permissions';

export const emergencyActions = ['accept', 'ignore'] as const;
export type EmergencyAction = (typeof emergencyActions)[number];

export const emergencyStatusList = [
  'OPEN',
  'DISPATCHING',
  'ACCEPTED',
  'CANCELLED_BY_CLIENT',
  'RESOLVED_BY_CLIENT',
  'REASSIGNMENT_NEEDED',
  'EXPIRED'
] as const;

export type EmergencyRequestStatus = (typeof emergencyStatusList)[number];

export const emergencyCandidateStatusList = ['NOTIFIED', 'ACCEPTED', 'IGNORED', 'EXPIRED', 'REVOKED'] as const;
export type EmergencyRequestCandidateStatus = (typeof emergencyCandidateStatusList)[number];

export const emergencyListModeSchema = z.enum(['client', 'contractor']);
export type EmergencyListMode = z.infer<typeof emergencyListModeSchema>;

export const createEmergencyRequestSchema = z.object({
  categoryId: z.string().uuid(),
  addressId: z.string().uuid(),
  description: z.string().trim().min(8).max(1000)
});

export const updateEmergencyRequestSchema = createEmergencyRequestSchema;

export const emergencyOwnerPatchSchema = z.discriminatedUnion('action', [
  updateEmergencyRequestSchema.extend({
    action: z.literal('update')
  }),
  z.object({
    action: z.literal('resolve')
  }),
  z.object({
    action: z.literal('republish')
  }),
  z.object({
    action: z.literal('cancel')
  })
]);

export const emergencyResponseSchema = z.object({
  action: z.enum(emergencyActions),
  note: z.string().trim().max(500).nullable().optional()
});

export const emergencyReassignSchema = z.object({
  reason: z.string().trim().min(1).max(500)
});

export type EmergencyRequestActor = PermissionContext;

const emergencyCandidateOrderBy: Prisma.EmergencyRequestCandidateOrderByWithRelationInput[] = [
  { dispatchRound: 'asc' },
  { createdAt: 'asc' }
];

const emergencyRequestSelect = Prisma.validator<Prisma.EmergencyRequestSelect>()({
  id: true,
  status: true,
  dispatchRound: true,
  expiresAt: true,
  description: true,
  acceptedAt: true,
  cancelledAt: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      email: true,
      displayName: true,
      profile: {
        select: {
          firstName: true,
          lastName: true
        }
      }
    }
  },
  category: {
    select: {
      id: true,
      slug: true,
      name: true
    }
  },
  address: {
    select: {
      id: true,
      label: true,
      line1: true,
      line2: true,
      city: true,
      province: true,
      postalCode: true,
      market: {
        select: {
          id: true,
          slug: true,
          city: true,
          province: true,
          country: true
        }
      }
    }
  },
  assignedContractorProfile: {
    select: {
      id: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          profile: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  },
  candidates: {
    select: {
      id: true,
      contractorProfileId: true,
      dispatchRound: true,
      status: true,
      notifiedAt: true,
      respondedAt: true,
      responseNote: true,
      contractorProfile: {
        select: {
          id: true,
          acceptsEmergencies: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true,
              profile: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: emergencyCandidateOrderBy
  }
});

type EmergencyRequestRow = Prisma.EmergencyRequestGetPayload<{ select: typeof emergencyRequestSelect }>;

export type EmergencyCandidateRecord = EmergencyRequestRow['candidates'][number];
export type EmergencyRequestRecord = EmergencyRequestRow;

const dispatchBatchSize = 3;
const emergencyDispatchWindowMinutes = 24 * 60;
const extendedEmergencyDispatchWindowMinutes = emergencyDispatchWindowMinutes;
const contractorBrowsableEmergencyStatuses: EmergencyRequestStatus[] = ['OPEN', 'DISPATCHING', 'REASSIGNMENT_NEEDED'];

function isClientActor(actor: EmergencyRequestActor): boolean {
  return actor.status === UserStatus.ACTIVE && actor.roles.includes('client');
}

function isContractorActor(actor: EmergencyRequestActor): boolean {
  return actor.status === UserStatus.ACTIVE && actor.roles.includes('contractor');
}

function isAdminActor(actor: EmergencyRequestActor): boolean {
  return actor.status === UserStatus.ACTIVE && actor.roles.includes('admin');
}

function resolveEmergencyListMode(actor: EmergencyRequestActor, requestedMode?: EmergencyListMode): EmergencyListMode | 'admin' | 'none' {
  if (requestedMode === 'client' && isClientActor(actor)) {
    return 'client';
  }

  if (requestedMode === 'contractor' && isContractorActor(actor)) {
    return 'contractor';
  }

  if (requestedMode) {
    return 'none';
  }

  if (isAdminActor(actor)) {
    return 'admin';
  }

  if (isClientActor(actor)) {
    return 'client';
  }

  if (isContractorActor(actor)) {
    return 'contractor';
  }

  return 'none';
}

function toEmergencyRecord(row: EmergencyRequestRow): EmergencyRequestRecord {
  return row;
}

function toCandidateVisibleContractorIds(row: EmergencyRequestRow): ReadonlyArray<string> {
  return row.candidates.map((candidate) => candidate.contractorProfile.user.id);
}

async function getContractorEmergencyBrowseScope(
  prisma: PrismaClient,
  actor: EmergencyRequestActor
): Promise<{ categoryIds: string[]; marketIds: string[] } | null> {
  const contractorProfile = await prisma.contractorProfile.findFirst({
    where: {
      userId: actor.userId,
      approvalStatus: 'APPROVED',
      acceptsEmergencies: true,
      user: {
        status: 'ACTIVE'
      }
    },
    select: {
      categories: {
        select: {
          categoryId: true
        }
      },
      workZones: {
        select: {
          workZone: {
            select: {
              marketId: true
            }
          }
        }
      }
    }
  });

  if (!contractorProfile) {
    return null;
  }

  const categoryIds = contractorProfile.categories.map((category) => category.categoryId);
  const marketIds = contractorProfile.workZones.map((workZone) => workZone.workZone.marketId);

  if (categoryIds.length === 0 || marketIds.length === 0) {
    return null;
  }

  return {
    categoryIds,
    marketIds
  };
}

async function getContractorEmergencyListWhere(
  prisma: PrismaClient,
  actor: EmergencyRequestActor
): Promise<Prisma.EmergencyRequestWhereInput> {
  const visibleConditions: Prisma.EmergencyRequestWhereInput[] = [
    {
      assignedContractorProfile: {
        userId: actor.userId
      }
    },
    {
      candidates: {
        some: {
          contractorProfile: {
            userId: actor.userId
          }
        }
      }
    }
  ];

  const browseScope = await getContractorEmergencyBrowseScope(prisma, actor);

  if (browseScope) {
    visibleConditions.push({
      status: {
        in: contractorBrowsableEmergencyStatuses
      },
      assignedContractorProfileId: null,
      categoryId: {
        in: browseScope.categoryIds
      },
      address: {
        marketId: {
          in: browseScope.marketIds
        }
      }
    });
  }

  return {
    OR: visibleConditions
  };
}

async function findEligibleContractors(
  prisma: PrismaClient,
  categoryId: string,
  marketId: string,
  excludedContractorProfileIds: ReadonlyArray<string> = []
) {
  return prisma.contractorProfile.findMany({
    where: {
      approvalStatus: 'APPROVED',
      acceptsEmergencies: true,
      user: {
        status: 'ACTIVE'
      },
      categories: {
        some: {
          categoryId
        }
      },
      workZones: {
        some: {
          workZone: {
            marketId
          }
        }
      },
      ...(excludedContractorProfileIds.length > 0
        ? {
            id: {
              notIn: [...excludedContractorProfileIds]
            }
          }
        : {})
    },
    select: {
      id: true
    },
    orderBy: [{ id: 'asc' }]
  });
}

export async function loadEmergencyRequest(
  prisma: PrismaClient,
  emergencyRequestId: string
): Promise<EmergencyRequestRow | null> {
  const row = await prisma.emergencyRequest.findUnique({
    where: { id: emergencyRequestId },
    select: emergencyRequestSelect
  });

  return row;
}

function canViewRow(actor: EmergencyRequestActor, row: EmergencyRequestRow): boolean {
  return canViewEmergencyRequest(actor, {
    clientUserId: row.client.id,
    assignedContractorUserId: row.assignedContractorProfile?.user.id ?? null,
    notifiedContractorUserIds: toCandidateVisibleContractorIds(row)
  });
}

export async function listEmergencyRequestsForActor(
  prisma: PrismaClient,
  actor: EmergencyRequestActor,
  options: { mode?: EmergencyListMode } = {}
): Promise<EmergencyRequestRecord[]> {
  const mode = resolveEmergencyListMode(actor, options.mode);
  const contractorWhere = mode === 'contractor' ? await getContractorEmergencyListWhere(prisma, actor) : null;
  const rows = await prisma.emergencyRequest.findMany({
    where: mode === 'admin'
      ? undefined
      : mode === 'client'
        ? {
            clientUserId: actor.userId,
            status: {
              not: 'CANCELLED_BY_CLIENT'
            }
          }
        : mode === 'contractor'
          ? contractorWhere ?? { OR: [] }
          : { OR: [] },
    select: emergencyRequestSelect,
    orderBy: [
      { createdAt: 'desc' }
    ]
  });

  return rows.map(toEmergencyRecord);
}

export async function getEmergencyRequestForActor(
  prisma: PrismaClient,
  actor: EmergencyRequestActor,
  emergencyRequestId: string
): Promise<EmergencyRequestRecord | null> {
  const row = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!row || !canViewRow(actor, row)) {
    return null;
  }

  return toEmergencyRecord(row);
}

function ensureClientActor(actor: EmergencyRequestActor): void {
  if (!canCreateEmergencyRequest(actor)) {
    throw new Error('forbidden');
  }
}

function ensureOwnClientEmergency(actor: EmergencyRequestActor, row: EmergencyRequestRow): void {
  ensureClientActor(actor);

  if (row.client.id !== actor.userId) {
    throw new Error('forbidden');
  }
}

function ensureAdminActor(actor: EmergencyRequestActor): void {
  if (!canReassignEmergencyRequest(actor)) {
    throw new Error('forbidden');
  }
}

export async function createEmergencyRequest(
  prisma: PrismaClient,
  actor: EmergencyRequestActor,
  input: z.infer<typeof createEmergencyRequestSchema>,
  options: { dispatchWindowMinutes?: number } = {}
): Promise<EmergencyRequestRecord> {
  ensureClientActor(actor);

  const parsed = createEmergencyRequestSchema.parse(input);

  const [address, category] = await Promise.all([
    prisma.address.findFirst({
      where: {
        id: parsed.addressId,
        userId: actor.userId
      },
      select: {
        id: true,
        marketId: true
      }
    }),
    prisma.category.findFirst({
      where: {
        id: parsed.categoryId,
        status: 'ACTIVE'
      },
      select: {
        id: true
      }
    })
  ]);

  if (!address) {
    throw new Error('invalid-address');
  }

  if (!category) {
    throw new Error('invalid-category');
  }

  if (!address.marketId) {
    throw new Error('invalid-address-market');
  }

  const eligibleContractors = await findEligibleContractors(prisma, parsed.categoryId, address.marketId);
  const selectedContractors = eligibleContractors.slice(0, dispatchBatchSize);
  const now = new Date();
  const dispatchWindowMinutes = options.dispatchWindowMinutes ?? emergencyDispatchWindowMinutes;
  const expiresAt = new Date(now.getTime() + dispatchWindowMinutes * 60 * 1000);

  const created = await prisma.$transaction(async (tx) => {
    const request = await tx.emergencyRequest.create({
      data: {
        clientUserId: actor.userId,
        categoryId: category.id,
        addressId: address.id,
        description: parsed.description,
        status: selectedContractors.length > 0 ? 'DISPATCHING' : 'EXPIRED',
        dispatchRound: 1,
        expiresAt
      },
      select: {
        id: true
      }
    });

    if (selectedContractors.length > 0) {
      await tx.emergencyRequestCandidate.createMany({
        data: selectedContractors.map((contractorProfile) => ({
          emergencyRequestId: request.id,
          contractorProfileId: contractorProfile.id,
          dispatchRound: 1,
          status: 'NOTIFIED',
          notifiedAt: now
        }))
      });
    }

    return request;
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'emergency_request.created',
    entityType: 'emergency_request',
    entityId: created.id,
    metadata: {
      categoryId: category.id,
      addressId: address.id,
      selectedContractors: selectedContractors.map((contractorProfile) => contractorProfile.id),
      expiresAt: expiresAt.toISOString()
    }
  });

  const loaded = await loadEmergencyRequest(prisma, created.id);

  if (!loaded) {
    throw new Error('not-found');
  }

  return toEmergencyRecord(loaded);
}

export async function respondToEmergencyRequest(
  prisma: PrismaClient,
  actor: EmergencyRequestActor,
  emergencyRequestId: string,
  action: EmergencyAction,
  note?: string | null
): Promise<EmergencyRequestRecord> {
  if (!canRespondToEmergencyRequest(actor, actor.userId)) {
    throw new Error('forbidden');
  }

  const row = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!row) {
    throw new Error('not-found');
  }

  const candidate = row.candidates.find((entry) => entry.contractorProfile.user.id === actor.userId);

  if (!candidate) {
    throw new Error('forbidden');
  }

  if (!['DISPATCHING', 'REASSIGNMENT_NEEDED', 'OPEN'].includes(row.status)) {
    throw new Error('invalid-state');
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    if (action === 'accept') {
      await tx.emergencyRequestCandidate.update({
        where: { id: candidate.id },
        data: {
          status: 'ACCEPTED',
          respondedAt: now,
          responseNote: note ?? null
        }
      });

      await tx.emergencyRequestCandidate.updateMany({
        where: {
          emergencyRequestId,
          id: {
            not: candidate.id
          },
          status: 'NOTIFIED'
        },
        data: {
          status: 'REVOKED'
        }
      });

      return tx.emergencyRequest.update({
        where: { id: emergencyRequestId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: now,
          assignedContractorProfileId: candidate.contractorProfileId
        },
        select: {
          id: true
        }
      });
    }

    await tx.emergencyRequestCandidate.update({
      where: { id: candidate.id },
      data: {
        status: 'IGNORED',
        respondedAt: now,
        responseNote: note ?? null
      }
    });

    return tx.emergencyRequest.findUnique({
      where: { id: emergencyRequestId },
      select: {
        id: true
      }
    });
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: `emergency_request.${action}`,
    entityType: 'emergency_request',
    entityId: emergencyRequestId,
    metadata: {
      note: note ?? null
    }
  });

  if (!updated) {
    throw new Error('not-found');
  }

  const loaded = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!loaded) {
    throw new Error('not-found');
  }

  return toEmergencyRecord(loaded);
}

export async function cancelEmergencyRequest(
  prisma: PrismaClient,
  actor: EmergencyRequestActor,
  emergencyRequestId: string
): Promise<EmergencyRequestRecord> {
  const row = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!row) {
    throw new Error('not-found');
  }

  ensureOwnClientEmergency(actor, row);

  if (!['DISPATCHING', 'OPEN', 'REASSIGNMENT_NEEDED', 'EXPIRED'].includes(row.status)) {
    throw new Error('invalid-state');
  }

  const now = new Date();

  const updated = await prisma.$transaction(async (tx) => {
    await tx.emergencyRequestCandidate.updateMany({
      where: {
        emergencyRequestId,
        status: 'NOTIFIED'
      },
      data: {
        status: 'REVOKED'
      }
    });

    return tx.emergencyRequest.update({
      where: { id: emergencyRequestId },
      data: {
        status: 'CANCELLED_BY_CLIENT',
        cancelledAt: now
      },
      select: {
        id: true
      }
    });
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'emergency_request.cancelled',
    entityType: 'emergency_request',
    entityId: emergencyRequestId,
    metadata: {
      cancelledAt: now.toISOString()
    }
  });

  const loaded = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!loaded) {
    throw new Error('not-found');
  }

  return toEmergencyRecord(loaded);
}

export async function updateEmergencyRequest(
  prisma: PrismaClient,
  actor: EmergencyRequestActor,
  emergencyRequestId: string,
  input: z.infer<typeof updateEmergencyRequestSchema>
): Promise<EmergencyRequestRecord> {
  const parsed = updateEmergencyRequestSchema.parse(input);
  const row = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!row) {
    throw new Error('not-found');
  }

  ensureOwnClientEmergency(actor, row);

  if (!['DISPATCHING', 'OPEN', 'REASSIGNMENT_NEEDED'].includes(row.status)) {
    throw new Error('invalid-state');
  }

  const [address, category] = await Promise.all([
    prisma.address.findFirst({
      where: {
        id: parsed.addressId,
        userId: actor.userId
      },
      select: {
        id: true
      }
    }),
    prisma.category.findFirst({
      where: {
        id: parsed.categoryId,
        status: 'ACTIVE'
      },
      select: {
        id: true
      }
    })
  ]);

  if (!address) {
    throw new Error('invalid-address');
  }

  if (!category) {
    throw new Error('invalid-category');
  }

  await prisma.emergencyRequest.update({
    where: { id: emergencyRequestId },
    data: {
      categoryId: category.id,
      addressId: address.id,
      description: parsed.description
    },
    select: {
      id: true
    }
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'emergency_request.updated',
    entityType: 'emergency_request',
    entityId: emergencyRequestId,
    metadata: {
      categoryId: category.id,
      addressId: address.id
    }
  });

  const loaded = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!loaded) {
    throw new Error('not-found');
  }

  return toEmergencyRecord(loaded);
}

export async function republishEmergencyRequest(
  prisma: PrismaClient,
  actor: EmergencyRequestActor,
  emergencyRequestId: string
): Promise<EmergencyRequestRecord> {
  const row = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!row) {
    throw new Error('not-found');
  }

  ensureOwnClientEmergency(actor, row);

  if (row.status !== 'EXPIRED') {
    throw new Error('invalid-state');
  }

  if (!row.address.market) {
    throw new Error('invalid-address-market');
  }

  const now = new Date();
  const nextRound = row.dispatchRound + 1;
  const expiresAt = new Date(now.getTime() + extendedEmergencyDispatchWindowMinutes * 60 * 1000);
  const eligibleContractors = await findEligibleContractors(prisma, row.category.id, row.address.market.id);
  const selectedContractors = eligibleContractors.slice(0, dispatchBatchSize);

  await prisma.$transaction(async (tx) => {
    await tx.emergencyRequestCandidate.updateMany({
      where: {
        emergencyRequestId,
        status: 'NOTIFIED'
      },
      data: {
        status: 'EXPIRED'
      }
    });

    if (selectedContractors.length > 0) {
      await tx.emergencyRequestCandidate.createMany({
        data: selectedContractors.map((contractorProfile) => ({
          emergencyRequestId,
          contractorProfileId: contractorProfile.id,
          dispatchRound: nextRound,
          status: 'NOTIFIED',
          notifiedAt: now
        }))
      });
    }

    return tx.emergencyRequest.update({
      where: { id: emergencyRequestId },
      data: {
        status: selectedContractors.length > 0 ? 'DISPATCHING' : 'EXPIRED',
        dispatchRound: nextRound,
        expiresAt,
        acceptedAt: null,
        assignedContractorProfileId: null
      },
      select: {
        id: true
      }
    });
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'emergency_request.extended',
    entityType: 'emergency_request',
    entityId: emergencyRequestId,
    metadata: {
      extendedEmergencyRequestId: emergencyRequestId,
      nextRound,
      expiresAt: expiresAt.toISOString(),
      selectedContractors: selectedContractors.map((contractorProfile) => contractorProfile.id)
    }
  });

  const loaded = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!loaded) {
    throw new Error('not-found');
  }

  return toEmergencyRecord(loaded);
}

export async function resolveEmergencyRequest(
  prisma: PrismaClient,
  actor: EmergencyRequestActor,
  emergencyRequestId: string
): Promise<EmergencyRequestRecord> {
  const row = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!row) {
    throw new Error('not-found');
  }

  ensureOwnClientEmergency(actor, row);

  if (['CANCELLED_BY_CLIENT', 'RESOLVED_BY_CLIENT', 'EXPIRED'].includes(row.status)) {
    throw new Error('invalid-state');
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.emergencyRequestCandidate.updateMany({
      where: {
        emergencyRequestId,
        status: 'NOTIFIED'
      },
      data: {
        status: 'REVOKED'
      }
    });

    return tx.emergencyRequest.update({
      where: { id: emergencyRequestId },
      data: {
        status: 'RESOLVED_BY_CLIENT',
        resolvedAt: now
      },
      select: {
        id: true
      }
    });
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'emergency_request.resolved',
    entityType: 'emergency_request',
    entityId: emergencyRequestId,
    metadata: {
      resolvedAt: now.toISOString()
    }
  });

  const loaded = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!loaded) {
    throw new Error('not-found');
  }

  return toEmergencyRecord(loaded);
}

export async function reassignEmergencyRequest(
  prisma: PrismaClient,
  actor: EmergencyRequestActor,
  emergencyRequestId: string,
  reason: string
): Promise<EmergencyRequestRecord> {
  ensureAdminActor(actor);

  const row = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!row) {
    throw new Error('not-found');
  }

  if (['ACCEPTED', 'CANCELLED_BY_CLIENT', 'EXPIRED'].includes(row.status)) {
    throw new Error('invalid-state');
  }

  const now = new Date();
  const nextRound = row.dispatchRound + 1;
  const excludedContractorProfileIds = row.candidates.map((candidate) => candidate.contractorProfileId);
  if (!row.address.market) {
    throw new Error('invalid-address-market');
  }
  const eligibleContractors = await findEligibleContractors(
    prisma,
    row.category.id,
    row.address.market.id,
    excludedContractorProfileIds
  );
  const selectedContractors = eligibleContractors.slice(0, dispatchBatchSize);

  const updated = await prisma.$transaction(async (tx) => {
    await tx.emergencyRequestCandidate.updateMany({
      where: {
        emergencyRequestId,
        status: 'NOTIFIED'
      },
      data: {
        status: 'EXPIRED'
      }
    });

    if (selectedContractors.length === 0) {
      return tx.emergencyRequest.update({
        where: { id: emergencyRequestId },
        data: {
          status: 'EXPIRED'
        },
        select: {
          id: true
        }
      });
    }

    await tx.emergencyRequestCandidate.createMany({
      data: selectedContractors.map((contractorProfile) => ({
        emergencyRequestId,
        contractorProfileId: contractorProfile.id,
        dispatchRound: nextRound,
        status: 'NOTIFIED',
        notifiedAt: now
      }))
    });

    return tx.emergencyRequest.update({
      where: { id: emergencyRequestId },
      data: {
        status: 'DISPATCHING',
        dispatchRound: nextRound,
        expiresAt: new Date(now.getTime() + emergencyDispatchWindowMinutes * 60 * 1000)
      },
      select: {
        id: true
      }
    });
  });

  await recordAuditLog({
    actorUserId: actor.userId,
    action: 'emergency_request.reassigned',
    entityType: 'emergency_request',
    entityId: emergencyRequestId,
    metadata: {
      reason,
      nextRound,
      selectedContractors: selectedContractors.map((contractorProfile) => contractorProfile.id)
    }
  });

  const loaded = await loadEmergencyRequest(prisma, emergencyRequestId);

  if (!loaded) {
    throw new Error('not-found');
  }

  return toEmergencyRecord(loaded);
}
