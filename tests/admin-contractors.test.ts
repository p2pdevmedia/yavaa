import { ContractorApprovalStatus, UserStatus, type PrismaClient } from '@prisma/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  listContractorProfilesForAdmin,
  reviewContractorProfileForAdmin,
  type AdminContractorActor
} from '@/lib/admin-contractors';
import { recordAuditLog } from '@/lib/audit';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

const activeAdmin: AdminContractorActor = {
  userId: 'admin_001',
  status: UserStatus.ACTIVE,
  roles: ['admin']
};

const activeSupport: AdminContractorActor = {
  userId: 'support_001',
  status: UserStatus.ACTIVE,
  roles: ['support']
};

function buildPrismaMock(overrides: Partial<PrismaClient> = {}): PrismaClient {
  return overrides as PrismaClient;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('admin contractor operations', () => {
  it('lists contractor profiles for active admins and filters by approval status', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'cp_001',
        approvalStatus: ContractorApprovalStatus.PENDING_REVIEW,
        acceptsEmergencies: true,
        dniNumber: '12345678',
        dniFrontUrl: 'https://example.com/front.jpg',
        dniBackUrl: 'https://example.com/back.jpg',
        profilePhotoUrl: 'https://example.com/profile.jpg',
        reviewNotes: null,
        submittedAt: new Date('2026-05-01T10:00:00.000Z'),
        reviewedAt: null,
        reviewedByUserId: null,
        createdAt: new Date('2026-05-01T09:00:00.000Z'),
        updatedAt: new Date('2026-05-01T10:00:00.000Z'),
        user: {
          id: 'contractor_001',
          email: 'contractor@yavaa.test',
          displayName: 'Contractor User',
          status: UserStatus.ACTIVE,
          profile: {
            firstName: 'Carlos',
            lastName: 'Perez',
            phone: '+54 9 2972 555000'
          }
        },
        address: {
          id: 'address_001',
          label: 'Workshop',
          city: 'San Martin de los Andes',
          province: 'Neuquen',
          market: {
            slug: 'san-martin-de-los-andes',
            city: 'San Martin de los Andes',
            province: 'Neuquen'
          }
        },
        categories: [
          {
            isPrimary: true,
            category: {
              id: 'category_001',
              slug: 'home-services',
              name: 'Home Services',
              group: 'home services'
            }
          }
        ],
        workZones: [
          {
            workZone: {
              id: 'zone_001',
              slug: 'central',
              name: 'Centro',
              market: {
                slug: 'san-martin-de-los-andes'
              }
            }
          }
        ]
      }
    ]);

    const contractors = await listContractorProfilesForAdmin(
      buildPrismaMock({
        contractorProfile: {
          findMany
        }
      } as unknown as PrismaClient),
      activeAdmin,
      {
        approvalStatus: ContractorApprovalStatus.PENDING_REVIEW
      }
    );

    expect(findMany).toHaveBeenCalledWith({
      where: {
        approvalStatus: ContractorApprovalStatus.PENDING_REVIEW
      },
      orderBy: [
        { submittedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      select: expect.any(Object)
    });
    expect(contractors[0]).toMatchObject({
      id: 'cp_001',
      approvalStatus: ContractorApprovalStatus.PENDING_REVIEW,
      user: {
        id: 'contractor_001',
        status: UserStatus.ACTIVE
      },
      categories: [
        {
          slug: 'home-services',
          isPrimary: true
        }
      ],
      workZones: [
        {
          slug: 'central',
          marketSlug: 'san-martin-de-los-andes'
        }
      ]
    });
  });

  it('blocks non-admin operational roles from listing contractor profiles', async () => {
    await expect(
      listContractorProfilesForAdmin(buildPrismaMock(), activeSupport, {})
    ).rejects.toThrow('forbidden');
  });

  it('approves a pending contractor profile and records an audit log', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'cp_001',
      approvalStatus: ContractorApprovalStatus.PENDING_REVIEW
    });
    const update = vi.fn().mockResolvedValue({
      id: 'cp_001',
      approvalStatus: ContractorApprovalStatus.APPROVED,
      reviewNotes: 'Documents verified.',
      reviewedAt: new Date('2026-05-01T12:00:00.000Z'),
      reviewedByUserId: activeAdmin.userId
    });

    const reviewed = await reviewContractorProfileForAdmin(
      buildPrismaMock({
        contractorProfile: {
          findUnique,
          update
        }
      } as unknown as PrismaClient),
      activeAdmin,
      'cp_001',
      {
        approvalStatus: ContractorApprovalStatus.APPROVED,
        reviewNotes: 'Documents verified.'
      }
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'cp_001' },
      data: {
        approvalStatus: ContractorApprovalStatus.APPROVED,
        reviewNotes: 'Documents verified.',
        reviewedByUserId: activeAdmin.userId,
        reviewedAt: expect.any(Date)
      },
      select: expect.any(Object)
    });
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'contractor_profile.approved',
      entityType: 'contractor_profile',
      entityId: 'cp_001',
      metadata: {
        previousApprovalStatus: ContractorApprovalStatus.PENDING_REVIEW,
        nextApprovalStatus: ContractorApprovalStatus.APPROVED,
        reviewNotes: 'Documents verified.'
      }
    });
    expect(reviewed.approvalStatus).toBe(ContractorApprovalStatus.APPROVED);
  });

  it('approves a draft contractor profile from admin verification', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'cp_001',
      approvalStatus: ContractorApprovalStatus.DRAFT
    });
    const update = vi.fn().mockResolvedValue({
      id: 'cp_001',
      approvalStatus: ContractorApprovalStatus.APPROVED,
      reviewNotes: 'Verified manually by admin.',
      reviewedAt: new Date('2026-05-01T12:00:00.000Z'),
      reviewedByUserId: activeAdmin.userId
    });

    const reviewed = await reviewContractorProfileForAdmin(
      buildPrismaMock({
        contractorProfile: {
          findUnique,
          update
        }
      } as unknown as PrismaClient),
      activeAdmin,
      'cp_001',
      {
        approvalStatus: ContractorApprovalStatus.APPROVED,
        reviewNotes: 'Verified manually by admin.'
      }
    );

    expect(update).toHaveBeenCalledTimes(1);
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'contractor_profile.approved',
        metadata: expect.objectContaining({
          previousApprovalStatus: ContractorApprovalStatus.DRAFT,
          nextApprovalStatus: ContractorApprovalStatus.APPROVED
        })
      })
    );
    expect(reviewed.approvalStatus).toBe(ContractorApprovalStatus.APPROVED);
  });

  it('rejects an approved contractor profile so the contractor must submit updated data', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'cp_001',
      approvalStatus: ContractorApprovalStatus.APPROVED
    });
    const update = vi.fn().mockResolvedValue({
      id: 'cp_001',
      approvalStatus: ContractorApprovalStatus.REJECTED,
      reviewNotes: 'DNI vencido. Volver a cargar documentación.',
      reviewedAt: new Date('2026-05-01T12:00:00.000Z'),
      reviewedByUserId: activeAdmin.userId
    });

    const reviewed = await reviewContractorProfileForAdmin(
      buildPrismaMock({
        contractorProfile: {
          findUnique,
          update
        }
      } as unknown as PrismaClient),
      activeAdmin,
      'cp_001',
      {
        approvalStatus: ContractorApprovalStatus.REJECTED,
        reviewNotes: 'DNI vencido. Volver a cargar documentación.'
      }
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: 'cp_001' },
      data: {
        approvalStatus: ContractorApprovalStatus.REJECTED,
        reviewNotes: 'DNI vencido. Volver a cargar documentación.',
        reviewedByUserId: activeAdmin.userId,
        reviewedAt: expect.any(Date)
      },
      select: expect.any(Object)
    });
    expect(recordAuditLog).toHaveBeenCalledWith({
      actorUserId: activeAdmin.userId,
      action: 'contractor_profile.rejected',
      entityType: 'contractor_profile',
      entityId: 'cp_001',
      metadata: {
        previousApprovalStatus: ContractorApprovalStatus.APPROVED,
        nextApprovalStatus: ContractorApprovalStatus.REJECTED,
        reviewNotes: 'DNI vencido. Volver a cargar documentación.'
      }
    });
    expect(reviewed.approvalStatus).toBe(ContractorApprovalStatus.REJECTED);
  });

  it('rejects invalid review attempts for contractor profiles that were already reviewed', async () => {
    const findUnique = vi.fn().mockResolvedValue({
      id: 'cp_001',
      approvalStatus: ContractorApprovalStatus.APPROVED
    });

    await expect(
      reviewContractorProfileForAdmin(
        buildPrismaMock({
          contractorProfile: {
            findUnique
          }
        } as unknown as PrismaClient),
        activeAdmin,
        'cp_001',
        {
          approvalStatus: ContractorApprovalStatus.APPROVED,
          reviewNotes: 'Documents verified.'
        }
      )
    ).rejects.toThrow('invalid-state');
  });

  it('returns not-found for missing contractor profiles', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);

    await expect(
      reviewContractorProfileForAdmin(
        buildPrismaMock({
          contractorProfile: {
            findUnique
          }
        } as unknown as PrismaClient),
        activeAdmin,
        'missing_cp',
        {
          approvalStatus: ContractorApprovalStatus.REJECTED,
          reviewNotes: 'Missing documents.'
        }
      )
    ).rejects.toThrow('contractor-profile-not-found');
  });
});
