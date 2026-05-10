import { UserStatus, type PrismaClient } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  deleteUserForAdmin,
  getUserForAdmin,
  listUserAuditLogsForAdmin,
  listUsersForAdmin,
  updateUserProfileForAdmin,
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

  it('deletes a user from Supabase Auth and removes local associated records in order', async () => {
    const existingUser = {
      id: 'user_001',
      email: 'worker@yavaa.test',
      supabaseAuthId: 'auth-user-001',
      displayName: 'Worker User',
      status: UserStatus.ACTIVE,
      contractorProfile: {
        id: 'contractor_001'
      }
    };
    const findUnique = vi.fn().mockResolvedValue(existingUser);
    const deleteUser = vi.fn().mockResolvedValue({ data: { user: {} }, error: null });
    const deletedModels: string[] = [];
    const tx = {
      booking: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'booking_client_001' },
          { id: 'booking_contractor_001' }
        ]),
        deleteMany: vi.fn(async () => {
          deletedModels.push('booking');
          return { count: 2 };
        })
      },
      emergencyRequest: {
        findMany: vi.fn().mockResolvedValue([{ id: 'emergency_001' }]),
        updateMany: vi.fn(),
        deleteMany: vi.fn(async () => {
          deletedModels.push('emergencyRequest');
          return { count: 1 };
        })
      },
      emergencyRequestCandidate: {
        deleteMany: vi.fn(async () => {
          deletedModels.push('emergencyRequestCandidate');
          return { count: 1 };
        })
      },
      bookingFile: {
        deleteMany: vi.fn(async () => {
          deletedModels.push('bookingFile');
          return { count: 2 };
        })
      },
      bookingMessage: {
        findMany: vi.fn().mockResolvedValue([{ id: 'message_001' }]),
        deleteMany: vi.fn(async () => {
          deletedModels.push('bookingMessage');
          return { count: 3 };
        })
      },
      notification: {
        deleteMany: vi.fn(async () => {
          deletedModels.push('notification');
          return { count: 2 };
        })
      },
      contractorCategory: {
        deleteMany: vi.fn(async () => {
          deletedModels.push('contractorCategory');
          return { count: 1 };
        })
      },
      contractorWorkZone: {
        deleteMany: vi.fn(async () => {
          deletedModels.push('contractorWorkZone');
          return { count: 1 };
        })
      },
      commissionDebt: {
        updateMany: vi.fn(async () => {
          deletedModels.push('commissionDebtCreator');
          return { count: 1 };
        })
      },
      userDebtLimit: {
        deleteMany: vi.fn(async () => {
          deletedModels.push('userDebtLimit');
          return { count: 2 };
        })
      },
      auditLog: {
        updateMany: vi.fn(async () => {
          deletedModels.push('auditLogActor');
          return { count: 1 };
        })
      },
      user: {
        delete: vi.fn(async () => {
          deletedModels.push('user');
          return { id: 'user_001' };
        })
      }
    };
    const transaction = vi.fn(async (callback: (transactionClient: typeof tx) => Promise<unknown>) => callback(tx));

    const result = await deleteUserForAdmin(
      buildPrismaMock({
        user: {
          findUnique
        },
        $transaction: transaction
      } as unknown as PrismaClient),
      activeAdmin,
      'user_001',
      {
        reason: 'Solicitud administrativa documentada.',
        supabaseAuthAdmin: {
          deleteUser
        }
      }
    );

    expect(deleteUser).toHaveBeenCalledWith('auth-user-001', false);
    expect(tx.booking.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { clientUserId: 'user_001' },
          { contractorProfileId: 'contractor_001' }
        ]
      },
      select: { id: true }
    });
    expect(tx.bookingFile.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { uploadedByUserId: 'user_001' },
          { bookingId: { in: ['booking_client_001', 'booking_contractor_001'] } },
          { messageId: { in: ['message_001'] } }
        ]
      }
    });
    expect(tx.emergencyRequest.updateMany).toHaveBeenCalledWith({
      where: { assignedContractorProfileId: 'contractor_001' },
      data: { assignedContractorProfileId: null }
    });
    expect(tx.user.delete).toHaveBeenCalledWith({
      where: { id: 'user_001' },
      select: { id: true }
    });
    expect(deletedModels.at(-1)).toBe('user');
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'user.deleted',
      entityType: 'user',
      entityId: 'user_001',
      metadata: {
        email: 'worker@yavaa.test',
        displayName: 'Worker User',
        previousStatus: UserStatus.ACTIVE,
        supabaseAuthId: 'auth-user-001',
        supabaseAuthDeleted: true,
        reason: 'Solicitud administrativa documentada.'
      }
    });
    expect(result).toEqual({
      id: 'user_001',
      email: 'worker@yavaa.test',
      supabaseAuthId: 'auth-user-001',
      deletedFromSupabaseAuth: true
    });
  });

  it('prevents admins from deleting their own account', async () => {
    await expect(
      deleteUserForAdmin(buildPrismaMock(), activeAdmin, activeAdmin.userId, {
        reason: 'Testing self deletion.',
        supabaseAuthAdmin: {
          deleteUser: vi.fn()
        }
      })
    ).rejects.toThrow('self-delete-forbidden');
  });

  it('returns a user inspection detail without loading audit activity', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'user_001',
      email: 'worker@yavaa.test',
      displayName: 'Worker User',
      status: UserStatus.ACTIVE,
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
      updatedAt: new Date('2026-05-01T11:00:00.000Z'),
      profile: {
        firstName: 'Worker',
        lastName: 'User',
        phone: '+54 9 2972 222222',
        avatarUrl: null,
        bio: 'Electricista'
      },
      roles: [
        {
          role: {
            slug: 'contractor',
            name: 'Contractor'
          }
        }
      ],
      contractorProfile: {
        id: 'contractor_001',
        approvalStatus: 'APPROVED',
        acceptsEmergencies: true,
        dniNumber: '12345678',
        dniFrontUrl: null,
        dniBackUrl: null,
        profilePhotoUrl: null,
        reviewNotes: 'Approved',
        submittedAt: new Date('2026-05-01T12:00:00.000Z'),
        reviewedAt: new Date('2026-05-01T13:00:00.000Z'),
        reviewedByUserId: 'admin_001',
        createdAt: new Date('2026-05-01T10:30:00.000Z'),
        updatedAt: new Date('2026-05-01T13:00:00.000Z'),
        address: {
          id: 'address_001',
          label: 'Base',
          city: 'San Martín de los Andes',
          province: 'Neuquén',
          market: {
            slug: 'san-martin-de-los-andes',
            city: 'San Martín de los Andes',
            province: 'Neuquén'
          }
        },
        categories: [
          {
            isPrimary: true,
            category: {
              id: 'category_001',
              slug: 'electricidad',
              name: 'Electricidad',
              group: 'home services'
            }
          }
        ],
        workZones: [
          {
            workZone: {
              id: 'zone_001',
              slug: 'centro',
              name: 'Centro',
              market: {
                slug: 'san-martin-de-los-andes'
              }
            }
          }
        ],
        bookings: [
          {
            id: 'booking_worker_001',
            status: 'ACCEPTED',
            description: 'Revisar tablero',
            scheduledFor: new Date('2026-05-02T14:00:00.000Z'),
            createdAt: new Date('2026-05-01T14:00:00.000Z'),
            client: {
              id: 'client_001',
              email: 'client@yavaa.test',
              displayName: 'Client User'
            },
            category: {
              id: 'category_001',
              slug: 'electricidad',
              name: 'Electricidad'
            }
          }
        ]
      },
      bookingsAsClient: [
        {
          id: 'booking_client_001',
          status: 'PENDING_ACCEPTANCE',
          description: 'Arreglar canilla',
          scheduledFor: new Date('2026-05-03T15:00:00.000Z'),
          createdAt: new Date('2026-05-01T15:00:00.000Z'),
          contractorProfile: {
            id: 'contractor_002',
            user: {
              id: 'worker_002',
              email: 'other-worker@yavaa.test',
              displayName: 'Other Worker'
            }
          },
          category: {
            id: 'category_002',
            slug: 'plomeria',
            name: 'Plomería'
          }
        }
      ],
      auditLogs: []
    });

    const detail = await getUserForAdmin(
      buildPrismaMock({
        user: {
          findUnique
        }
      } as unknown as PrismaClient),
      activeAdmin,
      'user_001'
    );

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 'user_001' },
      select: expect.any(Object)
    });
    expect(findUnique.mock.calls[0]?.[0].select).not.toHaveProperty('auditLogs');
    expect(detail.contractorProfile?.approvalStatus).toBe('APPROVED');
    expect(detail.bookingsAsClient).toHaveLength(1);
    expect(detail.bookingsAsContractor).toHaveLength(1);
    expect(detail).not.toHaveProperty('auditLogs');
  });

  it('loads user audit activity separately for active admins', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'audit_001',
        action: 'user.status_changed',
        entityType: 'user',
        entityId: 'user_001',
        metadata: {
          nextStatus: UserStatus.ACTIVE
        },
        createdAt: new Date('2026-05-01T16:00:00.000Z')
      }
    ]);

    const auditLogs = await listUserAuditLogsForAdmin(
      buildPrismaMock({
        auditLog: {
          findMany
        }
      } as unknown as PrismaClient),
      activeAdmin,
      'user_001'
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { actorUserId: 'user_001' },
          { entityType: 'user', entityId: 'user_001' }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: expect.any(Object),
      take: 50
    });
    expect(auditLogs).toEqual([
      {
        id: 'audit_001',
        action: 'user.status_changed',
        entityType: 'user',
        entityId: 'user_001',
        metadata: {
          nextStatus: UserStatus.ACTIVE
        },
        createdAt: '2026-05-01T16:00:00.000Z'
      }
    ]);
  });

  it('blocks suspended admins from loading user audit activity', async () => {
    await expect(
      listUserAuditLogsForAdmin(buildPrismaMock(), suspendedAdmin, 'user_001')
    ).rejects.toThrow('forbidden');
  });

  it('throws user-not-found when an inspected user does not exist', async () => {
    await expect(
      getUserForAdmin(
        buildPrismaMock({
          user: {
            findUnique: vi.fn().mockResolvedValue(null)
          }
        } as unknown as PrismaClient),
        activeAdmin,
        'missing_user'
      )
    ).rejects.toThrow('user-not-found');
  });

  it('updates editable user identity fields and records an audit log', async () => {
    const existingUser = {
      id: 'user_001',
      email: 'worker@yavaa.test',
      displayName: 'Worker User',
      profile: {
        firstName: 'Worker',
        lastName: 'User',
        phone: '+54 9 2972 222222',
        bio: 'Electricista'
      }
    };
    const updatedUser = {
      id: 'user_001',
      email: 'worker@yavaa.test',
      displayName: 'Worker Edited',
      status: UserStatus.ACTIVE,
      createdAt: new Date('2026-05-01T10:00:00.000Z'),
      updatedAt: new Date('2026-05-01T17:00:00.000Z'),
      profile: {
        firstName: 'Worker',
        lastName: 'Edited',
        phone: '+54 9 2972 333333',
        avatarUrl: null,
        bio: 'Electricista matriculado'
      },
      roles: [
        {
          role: {
            slug: 'contractor',
            name: 'Contractor'
          }
        }
      ],
      contractorProfile: null,
      bookingsAsClient: [],
      auditLogs: []
    };
    const findUnique = vi.fn().mockResolvedValueOnce(existingUser).mockResolvedValueOnce(updatedUser);
    const update = vi.fn().mockResolvedValue({ id: 'user_001' });
    const upsert = vi.fn().mockResolvedValue({ id: 'profile_001' });

    const detail = await updateUserProfileForAdmin(
      buildPrismaMock({
        user: {
          findUnique,
          update
        },
        profile: {
          upsert
        }
      } as unknown as PrismaClient),
      activeAdmin,
      'user_001',
      {
        displayName: 'Worker Edited',
        firstName: 'Worker',
        lastName: 'Edited',
        phone: '+54 9 2972 333333',
        bio: 'Electricista matriculado'
      }
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'user_001' },
      data: { displayName: 'Worker Edited' },
      select: { id: true }
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { userId: 'user_001' },
      update: {
        firstName: 'Worker',
        lastName: 'Edited',
        phone: '+54 9 2972 333333',
        bio: 'Electricista matriculado'
      },
      create: {
        userId: 'user_001',
        firstName: 'Worker',
        lastName: 'Edited',
        phone: '+54 9 2972 333333',
        bio: 'Electricista matriculado'
      },
      select: { id: true }
    });
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'user.profile_updated',
      entityType: 'user',
      entityId: 'user_001',
      metadata: {
        changedFields: ['displayName', 'lastName', 'phone', 'bio']
      }
    });
    expect(detail.displayName).toBe('Worker Edited');
    expect(detail.profile?.lastName).toBe('Edited');
  });
});
