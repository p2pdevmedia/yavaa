import { UserStatus, type PrismaClient } from '@prisma/client';
import { z } from 'zod';

import { recordAuditLog } from '@/lib/audit';
import { canManageUsers, type AppRoleSlug, type PermissionContext } from '@/lib/permissions';

export type AdminUserActor = PermissionContext;

export const updateAdminUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BLOCKED']),
  reason: z.string().trim().min(8).max(1000).optional()
});

export type AdminUserSummary = {
  id: string;
  email: string;
  displayName: string | null;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  profile: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  roles: Array<{
    slug: AppRoleSlug;
    name: string;
  }>;
};

export type AdminUserDetail = AdminUserSummary & {
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    bio: string | null;
  } | null;
  contractorProfile: {
    id: string;
    approvalStatus: string;
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
  } | null;
  bookingsAsClient: AdminUserBookingActivity[];
  bookingsAsContractor: AdminUserBookingActivity[];
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: unknown;
    createdAt: string;
  }>;
};

export type AdminUserBookingActivity = {
  id: string;
  status: string;
  description: string;
  scheduledFor: string;
  createdAt: string;
  counterparty: {
    id: string;
    email: string;
    displayName: string | null;
  };
  category: {
    id: string;
    slug: string;
    name: string;
  };
};

type AdminUserRow = {
  id: string;
  email: string;
  displayName: string | null;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  profile: {
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
  } | null;
  roles: Array<{
    role: {
      slug: AppRoleSlug;
      name: string;
    };
  }>;
};

type AdminUserDetailRow = AdminUserRow & {
  profile: {
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
    phone: string | null;
    bio: string | null;
  } | null;
  contractorProfile: {
    id: string;
    approvalStatus: string;
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
    bookings: Array<{
      id: string;
      status: string;
      description: string;
      scheduledFor: Date;
      createdAt: Date;
      client: {
        id: string;
        email: string;
        displayName: string | null;
      };
      category: {
        id: string;
        slug: string;
        name: string;
      };
    }>;
  } | null;
  bookingsAsClient: Array<{
    id: string;
    status: string;
    description: string;
    scheduledFor: Date;
    createdAt: Date;
    contractorProfile: {
      id: string;
      user: {
        id: string;
        email: string;
        displayName: string | null;
      };
    };
    category: {
      id: string;
      slug: string;
      name: string;
    };
  }>;
  auditLogs: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: unknown;
    createdAt: Date;
  }>;
};

const adminUserSelect = {
  id: true,
  email: true,
  displayName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      phone: true
    }
  },
  roles: {
    select: {
      role: {
        select: {
          slug: true,
          name: true
        }
      }
    },
    orderBy: {
      role: {
        slug: 'asc'
      }
    }
  }
} as const;

const adminUserDetailSelect = {
  ...adminUserSelect,
  profile: {
    select: {
      firstName: true,
      lastName: true,
      avatarUrl: true,
      phone: true,
      bio: true
    }
  },
  contractorProfile: {
    select: {
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
      },
      bookings: {
        select: {
          id: true,
          status: true,
          description: true,
          scheduledFor: true,
          createdAt: true,
          client: {
            select: {
              id: true,
              email: true,
              displayName: true
            }
          },
          category: {
            select: {
              id: true,
              slug: true,
              name: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      }
    }
  },
  bookingsAsClient: {
    select: {
      id: true,
      status: true,
      description: true,
      scheduledFor: true,
      createdAt: true,
      contractorProfile: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              email: true,
              displayName: true
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
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 20
  },
  auditLogs: {
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      metadata: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 25
  }
} as const;

function assertCanManageUsers(actor: AdminUserActor): void {
  if (!canManageUsers(actor)) {
    throw new Error('forbidden');
  }
}

function serializeAdminUser(row: AdminUserRow): AdminUserSummary {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    profile: row.profile,
    roles: row.roles.map((entry) => ({
      slug: entry.role.slug,
      name: entry.role.name
    }))
  };
}

function toIsoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null;
}

function serializeAdminUserDetail(row: AdminUserDetailRow): AdminUserDetail {
  const summary = serializeAdminUser(row);

  return {
    ...summary,
    profile: row.profile,
    contractorProfile: row.contractorProfile
      ? {
          id: row.contractorProfile.id,
          approvalStatus: row.contractorProfile.approvalStatus,
          acceptsEmergencies: row.contractorProfile.acceptsEmergencies,
          dniNumber: row.contractorProfile.dniNumber,
          dniFrontUrl: row.contractorProfile.dniFrontUrl,
          dniBackUrl: row.contractorProfile.dniBackUrl,
          profilePhotoUrl: row.contractorProfile.profilePhotoUrl,
          reviewNotes: row.contractorProfile.reviewNotes,
          submittedAt: toIsoOrNull(row.contractorProfile.submittedAt),
          reviewedAt: toIsoOrNull(row.contractorProfile.reviewedAt),
          reviewedByUserId: row.contractorProfile.reviewedByUserId,
          createdAt: row.contractorProfile.createdAt.toISOString(),
          updatedAt: row.contractorProfile.updatedAt.toISOString(),
          address: row.contractorProfile.address
            ? {
                id: row.contractorProfile.address.id,
                label: row.contractorProfile.address.label,
                city: row.contractorProfile.address.city,
                province: row.contractorProfile.address.province,
                marketSlug: row.contractorProfile.address.market?.slug ?? null,
                marketCity: row.contractorProfile.address.market?.city ?? null,
                marketProvince: row.contractorProfile.address.market?.province ?? null
              }
            : null,
          categories: row.contractorProfile.categories.map((entry) => ({
            id: entry.category.id,
            slug: entry.category.slug,
            name: entry.category.name,
            group: entry.category.group,
            isPrimary: entry.isPrimary
          })),
          workZones: row.contractorProfile.workZones.map((entry) => ({
            id: entry.workZone.id,
            slug: entry.workZone.slug,
            name: entry.workZone.name,
            marketSlug: entry.workZone.market.slug
          }))
        }
      : null,
    bookingsAsClient: row.bookingsAsClient.map((booking) => ({
      id: booking.id,
      status: booking.status,
      description: booking.description,
      scheduledFor: booking.scheduledFor.toISOString(),
      createdAt: booking.createdAt.toISOString(),
      counterparty: booking.contractorProfile.user,
      category: booking.category
    })),
    bookingsAsContractor:
      row.contractorProfile?.bookings.map((booking) => ({
        id: booking.id,
        status: booking.status,
        description: booking.description,
        scheduledFor: booking.scheduledFor.toISOString(),
        createdAt: booking.createdAt.toISOString(),
        counterparty: booking.client,
        category: booking.category
      })) ?? [],
    auditLogs: row.auditLogs.map((entry) => ({
      id: entry.id,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata,
      createdAt: entry.createdAt.toISOString()
    }))
  };
}

export async function listUsersForAdmin(
  prisma: PrismaClient,
  actor: AdminUserActor
): Promise<AdminUserSummary[]> {
  assertCanManageUsers(actor);

  const rows = (await prisma.user.findMany({
    orderBy: [
      { createdAt: 'desc' },
      { email: 'asc' }
    ],
    select: adminUserSelect
  })) as AdminUserRow[];

  return rows.map(serializeAdminUser);
}

export async function getUserForAdmin(
  prisma: PrismaClient,
  actor: AdminUserActor,
  userId: string
): Promise<AdminUserDetail> {
  assertCanManageUsers(actor);

  const row = (await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: adminUserDetailSelect
  })) as AdminUserDetailRow | null;

  if (!row) {
    throw new Error('user-not-found');
  }

  return serializeAdminUserDetail(row);
}

export async function updateUserStatusForAdmin(
  prisma: PrismaClient,
  actor: AdminUserActor,
  userId: string,
  input: z.infer<typeof updateAdminUserStatusSchema>
): Promise<AdminUserSummary> {
  assertCanManageUsers(actor);

  const parsed = updateAdminUserStatusSchema.parse(input);
  const nextStatus = parsed.status as UserStatus;
  const reason = parsed.reason?.trim() ?? null;

  if ((nextStatus === UserStatus.SUSPENDED || nextStatus === UserStatus.BLOCKED) && !reason) {
    throw new Error('reason-required');
  }

  if (actor.userId === userId && nextStatus !== UserStatus.ACTIVE) {
    throw new Error('self-status-change-forbidden');
  }

  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      status: true
    }
  });

  if (!currentUser) {
    throw new Error('user-not-found');
  }

  const updated = (await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      status: nextStatus
    },
    select: adminUserSelect
  })) as AdminUserRow;

  if (currentUser.status !== updated.status) {
    await recordAuditLog({
      actorUserId: actor.userId,
      action: 'user.status_changed',
      entityType: 'user',
      entityId: userId,
      metadata: {
        previousStatus: currentUser.status,
        nextStatus: updated.status,
        reason
      }
    });
  }

  return serializeAdminUser(updated);
}
