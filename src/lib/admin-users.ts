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
