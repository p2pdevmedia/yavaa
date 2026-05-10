import { ContractorApprovalStatus, UserStatus } from '@prisma/client';
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
        contractorRoleEnsured: true,
        submittedForReview: false
      }
    });
  });
});
