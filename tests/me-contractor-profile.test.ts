import { CategoryStatus, ContractorApprovalStatus, UserStatus } from '@prisma/client';
import { put } from '@vercel/blob';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PATCH } from '@/app/api/me/contractor-profile/route';
import { recordAuditLog } from '@/lib/audit';
import { resolveAppUser } from '@/lib/app-user';
import { ensureContractorRoleForUser } from '@/lib/contractor-profile';
import { getPrismaClient } from '@/lib/prisma';
import { resolveRequestAuth } from '@/lib/request-auth';

vi.mock('@/lib/audit', () => ({
  recordAuditLog: vi.fn()
}));

vi.mock('@/lib/app-user', () => ({
  resolveAppUser: vi.fn()
}));

vi.mock('@/lib/contractor-profile', () => ({
  ensureContractorRoleForUser: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  getPrismaClient: vi.fn()
}));

vi.mock('@/lib/request-auth', () => ({
  resolveRequestAuth: vi.fn()
}));

vi.mock('@vercel/blob', () => ({
  put: vi.fn(async (pathname: string) => ({
    url: `https://blob.vercel-storage.com/${pathname}`
  }))
}));

const mockedPut = vi.mocked(put);
const mockedRecordAuditLog = vi.mocked(recordAuditLog);
const mockedResolveAppUser = vi.mocked(resolveAppUser);
const mockedEnsureContractorRoleForUser = vi.mocked(ensureContractorRoleForUser);
const mockedGetPrismaClient = vi.mocked(getPrismaClient);
const mockedResolveRequestAuth = vi.mocked(resolveRequestAuth);

afterEach(() => {
  vi.resetAllMocks();
});

describe('me contractor profile API', () => {
  it('uses the account profile photo as the contractor profile photo and uploads only DNI photos', async () => {
    const appUser = {
      id: 'user_001',
      email: 'worker@yavaa.test',
      supabaseAuthId: 'auth_001',
      displayName: 'Worker User',
      status: UserStatus.ACTIVE,
      roles: ['client', 'contractor'],
      profile: {
        firstName: 'Worker',
        lastName: 'User',
        avatarUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
        phone: null,
        bio: null
      },
      addresses: [],
      contractorProfile: null
    };

    mockedResolveRequestAuth.mockResolvedValue({
      authenticated: true,
      configured: true,
      reason: null,
      identity: {
        id: 'auth_001',
        email: 'worker@yavaa.test'
      },
      appUser,
      matchedBy: 'supabase_auth_id',
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['client', 'contractor']
      }
    } as never);

    mockedResolveAppUser.mockResolvedValue({
      configured: true,
      matchedBy: 'supabase_auth_id',
      identity: {
        id: 'auth_001',
        email: 'worker@yavaa.test'
      },
      user: {
        ...appUser,
        contractorProfile: {
          id: 'contractor_profile_001',
          approvalStatus: ContractorApprovalStatus.DRAFT,
          acceptsEmergencies: true,
          hourlyRateCents: null,
          dniNumber: '12345678',
          dniFrontUrl: 'https://blob.vercel-storage.com/contractor-profiles/user_001/dni-front/front.jpg',
          dniBackUrl: 'https://blob.vercel-storage.com/contractor-profiles/user_001/dni-back/back.jpg',
          profilePhotoUrl: 'https://blob.vercel-storage.com/contractor-profiles/user_001/profile-photo/laboral.jpg',
          reviewNotes: null,
          submittedAt: null,
          reviewedAt: null,
          reviewedByUserId: null,
          addressId: null,
          categories: [],
          workZones: []
        }
      },
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['client', 'contractor']
      }
    } as never);

    const tx = {
      contractorProfile: {
        upsert: vi.fn().mockResolvedValue({})
      }
    };

    mockedGetPrismaClient.mockReturnValue({
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx))
    } as never);

    const formData = new FormData();
    formData.set('dniNumber', '12345678');
    formData.set('acceptsEmergencies', 'true');
    formData.set('dniFrontFile', new File(['frente'], 'DNI frente.PNG', { type: 'image/png' }));
    formData.set('dniBackFile', new File(['dorso'], 'DNI dorso.webp', { type: 'image/webp' }));

    const response = await PATCH({
      headers: new Headers({ 'content-type': 'multipart/form-data; boundary=test' }),
      formData: vi.fn().mockResolvedValue(formData)
    } as never);

    expect(response.status).toBe(200);
    expect(mockedPut).toHaveBeenCalledTimes(2);
    expect(mockedPut).toHaveBeenCalledWith(
      expect.stringMatching(/^contractor-profiles\/user_001\/dni-front\/[0-9a-f-]{36}-dni-frente\.png$/),
      expect.any(File),
      { access: 'private' }
    );
    expect(mockedPut).toHaveBeenCalledWith(
      expect.stringMatching(/^contractor-profiles\/user_001\/dni-back\/[0-9a-f-]{36}-dni-dorso\.webp$/),
      expect.any(File),
      { access: 'private' }
    );
    expect(tx.contractorProfile.upsert).toHaveBeenCalledWith({
      where: {
        userId: 'user_001'
      },
      update: {
        acceptsEmergencies: true,
        addressId: undefined,
        hourlyRateCents: undefined,
        dniNumber: '12345678',
        dniFrontUrl: expect.stringMatching(/^https:\/\/blob\.vercel-storage\.com\/contractor-profiles\/user_001\/dni-front\//),
        dniBackUrl: expect.stringMatching(/^https:\/\/blob\.vercel-storage\.com\/contractor-profiles\/user_001\/dni-back\//),
        profilePhotoUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
        reviewNotes: undefined,
        approvalStatus: undefined,
        submittedAt: undefined
      },
      create: {
        userId: 'user_001',
        acceptsEmergencies: true,
        addressId: null,
        hourlyRateCents: null,
        dniNumber: '12345678',
        dniFrontUrl: expect.stringMatching(/^https:\/\/blob\.vercel-storage\.com\/contractor-profiles\/user_001\/dni-front\//),
        dniBackUrl: expect.stringMatching(/^https:\/\/blob\.vercel-storage\.com\/contractor-profiles\/user_001\/dni-back\//),
        profilePhotoUrl: 'https://blob.vercel-storage.com/profiles/user_001/avatar.jpg',
        reviewNotes: null,
        approvalStatus: ContractorApprovalStatus.DRAFT,
        submittedAt: null
      }
    });
    expect(mockedEnsureContractorRoleForUser).toHaveBeenCalledWith(tx, 'user_001');
    expect(mockedRecordAuditLog).toHaveBeenCalledWith({
      actorUserId: 'user_001',
      action: 'contractor_profile.updated',
      entityType: 'contractor_profile',
      entityId: 'user_001',
      metadata: {
        addressChanged: false,
        categoriesChanged: false,
        contractorRoleEnsured: true,
        hourlyRateChanged: false,
        submittedForReview: false
      }
    });
  });

  it('stores hourly rate and selected active categories server-side', async () => {
    const appUser = {
      id: 'user_001',
      email: 'worker@yavaa.test',
      supabaseAuthId: 'auth_001',
      displayName: 'Worker User',
      status: UserStatus.ACTIVE,
      roles: ['client', 'contractor'],
      profile: null,
      addresses: [],
      contractorProfile: null
    };

    mockedResolveRequestAuth.mockResolvedValue({
      authenticated: true,
      configured: true,
      reason: null,
      identity: {
        id: 'auth_001',
        email: 'worker@yavaa.test'
      },
      appUser,
      matchedBy: 'supabase_auth_id',
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['client', 'contractor']
      }
    } as never);

    mockedResolveAppUser.mockResolvedValue({
      configured: true,
      matchedBy: 'supabase_auth_id',
      identity: {
        id: 'auth_001',
        email: 'worker@yavaa.test'
      },
      user: {
        ...appUser,
        contractorProfile: {
          id: 'contractor_profile_001',
          approvalStatus: ContractorApprovalStatus.DRAFT,
          acceptsEmergencies: false,
          hourlyRateCents: 125000,
          dniNumber: '12345678',
          dniFrontUrl: null,
          dniBackUrl: null,
          profilePhotoUrl: null,
          reviewNotes: null,
          submittedAt: null,
          reviewedAt: null,
          reviewedByUserId: null,
          addressId: null,
          categories: [
            {
              category: {
                id: '55555555-5555-4555-8555-555555555555',
                slug: 'plomeria',
                name: 'Plomería',
                group: null
              },
              isPrimary: true
            },
            {
              category: {
                id: '66666666-6666-4666-8666-666666666666',
                slug: 'electricidad',
                name: 'Electricidad',
                group: null
              },
              isPrimary: false
            }
          ],
          workZones: []
        }
      },
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['client', 'contractor']
      }
    } as never);

    const tx = {
      contractorProfile: {
        upsert: vi.fn().mockResolvedValue({ id: 'contractor_profile_001' })
      },
      contractorCategory: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 })
      }
    };

    mockedGetPrismaClient.mockReturnValue({
      category: {
        findMany: vi.fn().mockResolvedValue([
          { id: '55555555-5555-4555-8555-555555555555' },
          { id: '66666666-6666-4666-8666-666666666666' }
        ])
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx))
    } as never);

    const formData = new FormData();
    formData.set('dniNumber', '12345678');
    formData.set('hourlyRateCents', '125000');
    formData.set('acceptsEmergencies', 'false');
    formData.append('categoryIds', '55555555-5555-4555-8555-555555555555');
    formData.append('categoryIds', '66666666-6666-4666-8666-666666666666');

    const response = await PATCH({
      headers: new Headers({ 'content-type': 'multipart/form-data; boundary=test' }),
      formData: vi.fn().mockResolvedValue(formData)
    } as never);

    const prisma = mockedGetPrismaClient.mock.results[0]?.value as {
      category: {
        findMany: ReturnType<typeof vi.fn>;
      };
    };

    expect(response.status).toBe(200);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666']
        },
        status: CategoryStatus.ACTIVE
      },
      select: {
        id: true
      }
    });
    expect(tx.contractorProfile.upsert).toHaveBeenCalledWith({
      where: {
        userId: 'user_001'
      },
      update: expect.objectContaining({
        hourlyRateCents: 125000
      }),
      create: expect.objectContaining({
        hourlyRateCents: 125000
      })
    });
    expect(tx.contractorCategory.deleteMany).toHaveBeenCalledWith({
      where: {
        contractorProfileId: 'contractor_profile_001'
      }
    });
    expect(tx.contractorCategory.createMany).toHaveBeenCalledWith({
      data: [
        {
          contractorProfileId: 'contractor_profile_001',
          categoryId: '55555555-5555-4555-8555-555555555555',
          isPrimary: true
        },
        {
          contractorProfileId: 'contractor_profile_001',
          categoryId: '66666666-6666-4666-8666-666666666666',
          isPrimary: false
        }
      ]
    });
    expect(mockedRecordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          categoriesChanged: true,
          hourlyRateChanged: true
        })
      })
    );
  });

  it('syncs contractor work zones from the selected work address market', async () => {
    const appUser = {
      id: 'user_001',
      email: 'worker@yavaa.test',
      supabaseAuthId: 'auth_001',
      displayName: 'Worker User',
      status: UserStatus.ACTIVE,
      roles: ['client', 'contractor'],
      profile: null,
      addresses: [],
      contractorProfile: null
    };

    mockedResolveRequestAuth.mockResolvedValue({
      authenticated: true,
      configured: true,
      reason: null,
      identity: {
        id: 'auth_001',
        email: 'worker@yavaa.test'
      },
      appUser,
      matchedBy: 'supabase_auth_id',
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['client', 'contractor']
      }
    } as never);

    mockedResolveAppUser.mockResolvedValue({
      configured: true,
      matchedBy: 'supabase_auth_id',
      identity: {
        id: 'auth_001',
        email: 'worker@yavaa.test'
      },
      user: {
        ...appUser,
        contractorProfile: {
          id: 'contractor_profile_001',
          approvalStatus: ContractorApprovalStatus.DRAFT,
          acceptsEmergencies: true,
          hourlyRateCents: null,
          dniNumber: null,
          dniFrontUrl: null,
          dniBackUrl: null,
          profilePhotoUrl: null,
          reviewNotes: null,
          submittedAt: null,
          reviewedAt: null,
          reviewedByUserId: null,
          addressId: '11111111-1111-4111-8111-111111111111',
          categories: [],
          workZones: [
            {
              workZone: {
                id: '22222222-2222-4222-8222-222222222222',
                slug: 'central',
                name: 'Centro',
                description: null,
                market: {
                  id: '33333333-3333-4333-8333-333333333333',
                  slug: 'san-martin-de-los-andes',
                  city: 'San Martin de los Andes',
                  province: 'Neuquen',
                  country: 'Argentina'
                }
              }
            }
          ]
        }
      },
      permissionContext: {
        userId: 'user_001',
        status: UserStatus.ACTIVE,
        roles: ['client', 'contractor']
      }
    } as never);

    const tx = {
      contractorProfile: {
        upsert: vi.fn().mockResolvedValue({ id: 'contractor_profile_001' })
      },
      contractorWorkZone: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 1 })
      }
    };

    mockedGetPrismaClient.mockReturnValue({
      address: {
        findFirst: vi.fn().mockResolvedValue({
          id: '11111111-1111-4111-8111-111111111111',
          market: {
            workZones: [{ id: '22222222-2222-4222-8222-222222222222' }]
          }
        })
      },
      $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx))
    } as never);

    const response = await PATCH({
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({
        acceptsEmergencies: true,
        addressId: '11111111-1111-4111-8111-111111111111'
      })
    } as never);

    const prisma = mockedGetPrismaClient.mock.results[0]?.value as {
      address: {
        findFirst: ReturnType<typeof vi.fn>;
      };
    };

    expect(response.status).toBe(200);
    expect(prisma.address.findFirst).toHaveBeenCalledWith({
      where: {
        id: '11111111-1111-4111-8111-111111111111',
        userId: 'user_001'
      },
      select: {
        id: true,
        market: {
          select: {
            workZones: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });
    expect(tx.contractorWorkZone.deleteMany).toHaveBeenCalledWith({
      where: {
        contractorProfileId: 'contractor_profile_001'
      }
    });
    expect(tx.contractorWorkZone.createMany).toHaveBeenCalledWith({
      data: [
        {
          contractorProfileId: 'contractor_profile_001',
          workZoneId: '22222222-2222-4222-8222-222222222222'
        }
      ]
    });
    expect(mockedRecordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          addressChanged: true,
          workZonesChanged: true
        })
      })
    );
  });
});
