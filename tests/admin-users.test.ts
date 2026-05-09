import { UserStatus, type PrismaClient } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  listUsersForAdmin,
  updateUserStatusForAdmin,
  type AdminUserActor
} from '@/lib/admin-users';
import { recordAuditLog } from '@/lib/audit';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

const activeAdmin: AdminUserActor = {
  userId: 'admin_001',
  status: UserStatus.ACTIVE,
  roles: ['admin']
};

const suspendedAdmin: AdminUserActor = {
  userId: 'admin_002',
  status: UserStatus.SUSPENDED,
  roles: ['admin']
};

function buildPrismaMock(overrides: Partial<PrismaClient> = {}): PrismaClient {
  return overrides as PrismaClient;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('admin user operations', () => {
  it('lists users with roles for active admins', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'user_001',
        email: 'client@yavaa.test',
        displayName: 'Client User',
        status: UserStatus.ACTIVE,
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        updatedAt: new Date('2026-05-01T11:00:00.000Z'),
        profile: {
          firstName: 'Client',
          lastName: 'User',
          phone: '+54 9 2972 111111'
        },
        roles: [
          {
            role: {
              slug: 'client',
              name: 'Client'
            }
          }
        ]
      }
    ]);

    const users = await listUsersForAdmin(
      buildPrismaMock({
        user: {
          findMany
        }
      } as unknown as PrismaClient),
      activeAdmin
    );

    expect(findMany).toHaveBeenCalledWith({
      orderBy: [
        { createdAt: 'desc' },
        { email: 'asc' }
      ],
      select: expect.any(Object)
    });
    expect(users).toEqual([
      {
        id: 'user_001',
        email: 'client@yavaa.test',
        displayName: 'Client User',
        status: UserStatus.ACTIVE,
        createdAt: '2026-05-01T10:00:00.000Z',
        updatedAt: '2026-05-01T11:00:00.000Z',
        profile: {
          firstName: 'Client',
          lastName: 'User',
          phone: '+54 9 2972 111111'
        },
        roles: [
          {
            slug: 'client',
            name: 'Client'
          }
        ]
      }
    ]);
  });

  it('blocks suspended admins from listing users', async () => {
    await expect(
      listUsersForAdmin(buildPrismaMock(), suspendedAdmin)
    ).rejects.toThrow('forbidden');
  });

  it('updates a user status and records an audit log', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'user_001',
      status: UserStatus.ACTIVE
    });
    const update = vi.fn().mockResolvedValue({
      id: 'user_001',
      email: 'client@yavaa.test',
      displayName: 'Client User',
      status: UserStatus.SUSPENDED,
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
      updatedAt: new Date('2026-05-01T12:00:00.000Z'),
      profile: null,
      roles: [
        {
          role: {
            slug: 'client',
            name: 'Client'
          }
        }
      ]
    });

    const user = await updateUserStatusForAdmin(
      buildPrismaMock({
        user: {
          findUnique,
          update
        }
      } as unknown as PrismaClient),
      activeAdmin,
      'user_001',
      {
        status: UserStatus.SUSPENDED,
        reason: 'Repeated policy violation.'
      }
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'user_001' },
      data: { status: UserStatus.SUSPENDED },
      select: expect.any(Object)
    });
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: 'admin_001',
      action: 'user.status_changed',
      entityType: 'user',
      entityId: 'user_001',
      metadata: {
        previousStatus: UserStatus.ACTIVE,
        nextStatus: UserStatus.SUSPENDED,
        reason: 'Repeated policy violation.'
      }
    });
    expect(user.status).toBe(UserStatus.SUSPENDED);
  });

  it('requires a reason when blocking or suspending a user', async () => {
    await expect(
      updateUserStatusForAdmin(buildPrismaMock(), activeAdmin, 'user_001', {
        status: UserStatus.BLOCKED
      })
    ).rejects.toThrow('reason-required');
  });

  it('prevents admins from suspending or blocking their own account', async () => {
    await expect(
      updateUserStatusForAdmin(buildPrismaMock(), activeAdmin, activeAdmin.userId, {
        status: UserStatus.SUSPENDED,
        reason: 'Testing self lockout.'
      })
    ).rejects.toThrow('self-status-change-forbidden');
  });
});
